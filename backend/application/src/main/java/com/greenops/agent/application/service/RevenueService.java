package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.*;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueService {

    private final RevenuePeriodRepository periodRepository;
    private final RevenueDetailRepository detailRepository;
    private final DriverRepository driverRepository;
    private final CompanyRepository companyRepository;

    // ========== Period CRUD ==========

    public PageResponse<RevenuePeriodResponse> getPeriods(UUID companyId, Pageable pageable) {
        Page<RevenuePeriod> page = periodRepository.findByCompanyIdOrderByStartDateDesc(companyId, pageable);
        return PageResponse.<RevenuePeriodResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public RevenuePeriodResponse getPeriod(UUID companyId, UUID periodId) {
        RevenuePeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ báo cáo", periodId));
        if (!period.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Kỳ báo cáo", periodId);
        }
        return toResponse(period);
    }

    @Transactional
    public RevenuePeriodResponse createPeriod(UUID companyId, RevenuePeriodRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Công ty", companyId));

        if (periodRepository.existsByCompanyIdAndStartDateAndEndDate(
                companyId, request.getStartDate(), request.getEndDate())) {
            throw new BusinessException("Kỳ báo cáo từ " + request.getStartDate()
                    + " đến " + request.getEndDate() + " đã tồn tại");
        }

        RevenuePeriod period = RevenuePeriod.builder()
                .company(company)
                .name(request.getName())
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .source("excel")
                .status("draft")
                .note(request.getNote())
                .build();

        period = periodRepository.save(period);
        log.info("Created revenue period: {}", period.getName());
        return toResponse(period);
    }

    @Transactional
    public RevenuePeriodResponse updatePeriodStatus(UUID companyId, UUID periodId, String status) {
        RevenuePeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ báo cáo", periodId));
        if (!period.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Kỳ báo cáo", periodId);
        }

        // Validate transition
        String currentStatus = period.getStatus();
        if ("closed".equals(currentStatus)) {
            throw new BusinessException("Kỳ báo cáo đã đóng, không thể thay đổi trạng thái");
        }

        period.setStatus(status);
        period = periodRepository.save(period);
        log.info("Updated period {} status to {}", period.getName(), status);
        return toResponse(period);
    }

    // ========== Revenue Detail ==========

    public PageResponse<RevenueDetailResponse> getRevenueDetails(UUID companyId, UUID periodId, Pageable pageable) {
        RevenuePeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ báo cáo", periodId));
        if (!period.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Kỳ báo cáo", periodId);
        }

        Page<RevenueDetail> page = detailRepository.findByPeriodId(periodId, pageable);
        return PageResponse.<RevenueDetailResponse>builder()
                .items(page.getContent().stream().map(this::toDetailResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public RevenueDetailResponse getRevenueDetail(UUID companyId, UUID periodId, UUID detailId) {
        RevenueDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new ResourceNotFoundException("Chi tiết doanh thu", detailId));
        if (!detail.getPeriod().getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Chi tiết doanh thu", detailId);
        }
        return toDetailResponse(detail);
    }

    // ========== Import Excel ==========

    @Transactional
    public ImportResult importExcel(UUID companyId, UUID periodId, MultipartFile file) {
        RevenuePeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ báo cáo", periodId));
        if (!period.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Kỳ báo cáo", periodId);
        }
        if (!"draft".equals(period.getStatus()) && !"imported".equals(period.getStatus())) {
            throw new BusinessException("Kỳ báo cáo đã được xác nhận, không thể import thêm");
        }

        ImportResult result = new ImportResult();
        result.totalRows = 0;
        result.successRows = 0;
        result.errorRows = 0;
        result.errors = new ArrayList<>();

        try (InputStream is = file.getInputStream()) {
            org.apache.poi.ss.usermodel.Workbook workbook =
                    new org.apache.poi.xssf.usermodel.XSSFWorkbook(is);
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(0);

            // Tìm dòng header (dòng 6 - 1-based, tức index 5)
            int headerRowIndex = -1;
            for (int i = 0; i <= 10 && i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row != null) {
                    org.apache.poi.ss.usermodel.Cell cell = row.getCell(0);
                    if (cell != null && cell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING
                            && "#".equals(cell.getStringCellValue().trim())) {
                        headerRowIndex = i;
                        break;
                    }
                }
            }

            if (headerRowIndex < 0) {
                throw new BusinessException("Không tìm thấy dòng tiêu đề (cột #) trong file Excel");
            }

            // Map column index by header name
            Map<String, Integer> colMap = new HashMap<>();
            org.apache.poi.ss.usermodel.Row headerRow = sheet.getRow(headerRowIndex);
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.getCell(i);
                if (cell != null && cell.getCellType() == org.apache.poi.ss.usermodel.CellType.STRING) {
                    colMap.put(cell.getStringCellValue().trim(), i);
                }
            }

            result.totalRows = sheet.getLastRowNum() - headerRowIndex;

            // Đọc dữ liệu từ dòng header+1 đến dòng cuối - 1 (bỏ qua dòng tổng)
            for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
                org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    // Kiểm tra dòng tổng
                    org.apache.poi.ss.usermodel.Cell firstCell = row.getCell(getCol(colMap, "#"));
                    if (firstCell != null) {
                        String val = getCellStringValue(firstCell);
                        if ("TỔNG".equalsIgnoreCase(val.trim()) || val.trim().toUpperCase().contains("TỔNG")) {
                            continue; // Bỏ qua dòng tổng
                        }
                    }

                    String driverCode = getCellStringValue(row, colMap, "Mã LX");
                    if (driverCode == null || driverCode.isEmpty()) {
                        continue; // Bỏ qua dòng trống
                    }

                    // Tìm driver, nếu không có thì tự động tạo mới
                    Driver driver = driverRepository.findByCompanyIdAndDriverCode(companyId, driverCode)
                            .orElse(null);
                    if (driver == null) {
                        String fullName = getCellStringValue(row, colMap, "Tên tài xế");
                        String cccd = getCellStringValue(row, colMap, "Số CCCD");

                        driver = Driver.builder()
                                .company(period.getCompany())
                                .driverCode(driverCode)
                                .fullName(fullName != null ? fullName : driverCode)
                                .cccd(cccd)
                                .joinDate(period.getStartDate())
                                .status("active")
                                .depositAmount(BigDecimal.ZERO)
                                .build();

                        // Parse birth date (có thể là string "dd/MM/yyyy" hoặc Excel date number)
                        driver.setBirthDate(getDateCellValue(row, colMap, "Ngày sinh"));

                        driver = driverRepository.save(driver);
                        result.driversCreated++;
                        log.info("Auto-created driver: {} - {}", driverCode, fullName);
                    }

                    // Đọc dữ liệu
                    RevenueDetail detail = detailRepository.findByPeriodIdAndDriverId(periodId, driver.getId())
                            .orElse(RevenueDetail.builder()
                                    .period(period)
                                    .driver(driver)
                                    .build());

                    detail.setTotalRevenue(getDecimalCellValue(row, colMap, "Tổng doanh thu"));
                    detail.setTotalTrips(getIntCellValue(row, colMap, "Tổng số chuyến"));
                    detail.setInsuranceFee(getDecimalCellValue(row, colMap, "Bảo hiểm"));
                    detail.setNonCashFee(getDecimalCellValue(row, colMap, "Phí GD ko dùng tiền mặt"));
                    detail.setDiscountTax(getDecimalCellValue(row, colMap, "Chiết khấu + thuế"));
                    detail.setBonus(getDecimalCellValue(row, colMap, "Thưởng"));
                    detail.setOtherIncome(getDecimalCellValue(row, colMap, "Thu nhập khác"));
                    detail.setPenalty(getDecimalCellValue(row, colMap, "Phạt"));
                    detail.setOtherCost(getDecimalCellValue(row, colMap, "Chi phí khác"));
                    detail.setXanhBalance(getDecimalCellValue(row, colMap, "Số dư app Xanh"));
                    detail.setDepositIn(getDecimalCellValue(row, colMap, "Tiền nạp"));
                    detail.setWithdrawn(getDecimalCellValue(row, colMap, "Đã rút"));
                    detail.setAvailableBalance(getDecimalCellValue(row, colMap, "Số dư khả dụng (ví nội bộ)"));
                    detail.setTip(getDecimalCellValue(row, colMap, "Tiền Tip"));
                    detail.setPromotion(getDecimalCellValue(row, colMap, "Khuyến mại"));
                    detail.setSurcharge(getDecimalCellValue(row, colMap, "Phụ phí"));
                    detail.setTotalBalance(getDecimalCellValue(row, colMap, "Tổng số dư"));
                    detail.setChargeRefund(getDecimalCellValue(row, colMap, "Hoàn tiền sạc"));

                    detailRepository.save(detail);
                    result.successRows++;

                } catch (Exception e) {
                    log.error("Error importing row {}: {}", i + 1, e.getMessage());
                    result.errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                    result.errorRows++;
                }
            }

            workbook.close();
        } catch (Exception e) {
            log.error("Error importing Excel", e);
            throw new BusinessException("Lỗi đọc file Excel: " + e.getMessage());
        }

        // Cập nhật trạng thái period
        if (result.successRows > 0 && "draft".equals(period.getStatus())) {
            period.setStatus("imported");
            periodRepository.save(period);
        }

        log.info("Import result: {} success, {} error out of {} rows",
                result.successRows, result.errorRows, result.totalRows);
        return result;
    }

    // ========== Private helpers ==========

    private int getCol(Map<String, Integer> colMap, String name) {
        // Try exact match first
        Integer idx = colMap.get(name);
        if (idx != null) return idx;

        // Try case-insensitive
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().trim().equalsIgnoreCase(name.trim())) {
                return entry.getValue();
            }
        }

        // Try contains
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().toLowerCase().contains(name.toLowerCase())
                    || name.toLowerCase().contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }

        return -1;
    }

    private String getCellStringValue(org.apache.poi.ss.usermodel.Row row,
                                      Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return null;
        org.apache.poi.ss.usermodel.Cell cell = row.getCell(col);
        return cell != null ? getCellStringValue(cell) : null;
    }

    private String getCellStringValue(org.apache.poi.ss.usermodel.Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private BigDecimal getDecimalCellValue(org.apache.poi.ss.usermodel.Row row,
                                           Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return BigDecimal.ZERO;
        org.apache.poi.ss.usermodel.Cell cell = row.getCell(col);
        if (cell == null) return BigDecimal.ZERO;

        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> {
                String val = cell.getStringCellValue().trim();
                if (val.isEmpty() || val.equals("-")) yield BigDecimal.ZERO;
                try {
                    yield new BigDecimal(val.replace(",", ""));
                } catch (NumberFormatException e) {
                    yield BigDecimal.ZERO;
                }
            }
            default -> BigDecimal.ZERO;
        };
    }

    private int getIntCellValue(org.apache.poi.ss.usermodel.Row row,
                                Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return 0;
        org.apache.poi.ss.usermodel.Cell cell = row.getCell(col);
        if (cell == null) return 0;

        return switch (cell.getCellType()) {
            case NUMERIC -> (int) cell.getNumericCellValue();
            case STRING -> {
                String val = cell.getStringCellValue().trim();
                if (val.isEmpty()) yield 0;
                try {
                    yield Integer.parseInt(val.replace(",", ""));
                } catch (NumberFormatException e) {
                    yield 0;
                }
            }
            default -> 0;
        };
    }

    private LocalDate getDateCellValue(org.apache.poi.ss.usermodel.Row row,
                                       Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return null;
        org.apache.poi.ss.usermodel.Cell cell = row.getCell(col);
        if (cell == null) return null;

        try {
            if (cell.getCellType() == org.apache.poi.ss.usermodel.CellType.NUMERIC
                    && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }
        } catch (Exception ignored) {}

        // Try parsing as string
        String val = getCellStringValue(cell);
        if (val == null || val.isEmpty()) return null;

        // Try multiple formats
        String[] formats = {"dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "dd/MM/yyyy HH:mm:ss"};
        for (String fmt : formats) {
            try {
                return LocalDate.parse(val, java.time.format.DateTimeFormatter.ofPattern(fmt));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private RevenuePeriodResponse toResponse(RevenuePeriod period) {
        long driverCount = detailRepository.countByPeriodId(period.getId());
        BigDecimal totalRevenue = detailRepository.sumTotalRevenueByPeriodId(period.getId());

        return RevenuePeriodResponse.builder()
                .id(period.getId())
                .name(period.getName())
                .type(period.getType())
                .startDate(period.getStartDate().atStartOfDay())
                .endDate(period.getEndDate().atStartOfDay())
                .source(period.getSource())
                .status(period.getStatus())
                .note(period.getNote())
                .driverCount(driverCount)
                .totalRevenue(totalRevenue)
                .createdAt(period.getCreatedAt())
                .updatedAt(period.getUpdatedAt())
                .build();
    }

    private RevenueDetailResponse toDetailResponse(RevenueDetail detail) {
        return RevenueDetailResponse.builder()
                .id(detail.getId())
                .driverId(detail.getDriver().getId())
                .driverCode(detail.getDriver().getDriverCode())
                .driverName(detail.getDriver().getFullName())
                .totalRevenue(detail.getTotalRevenue())
                .totalTrips(detail.getTotalTrips())
                .insuranceFee(detail.getInsuranceFee())
                .nonCashFee(detail.getNonCashFee())
                .discountTax(detail.getDiscountTax())
                .penalty(detail.getPenalty())
                .otherCost(detail.getOtherCost())
                .surcharge(detail.getSurcharge())
                .bonus(detail.getBonus())
                .otherIncome(detail.getOtherIncome())
                .tip(detail.getTip())
                .promotion(detail.getPromotion())
                .chargeRefund(detail.getChargeRefund())
                .xanhBalance(detail.getXanhBalance())
                .depositIn(detail.getDepositIn())
                .withdrawn(detail.getWithdrawn())
                .availableBalance(detail.getAvailableBalance())
                .totalBalance(detail.getTotalBalance())
                .totalDeduction(detail.getTotalDeduction())
                .totalAddition(detail.getTotalAddition())
                .earnedAmount(detail.getEarnedAmount())
                .note(detail.getNote())
                .build();
    }

    @lombok.Data
    public static class ImportResult {
        private int totalRows;
        private int successRows;
        private int errorRows;
        private int driversCreated;
        private List<String> errors;
    }
}
