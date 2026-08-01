package com.greenops.agent.application.service;

import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.CompanyRepository;
import com.greenops.agent.domain.Driver;
import com.greenops.agent.domain.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverImportService {

    private final DriverRepository driverRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public ImportResult importDrivers(String companyCode, String filePath) {
        Company company = companyRepository.findByCode(companyCode)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyCode));

        ImportResult result = new ImportResult();

        try (InputStream is = new FileInputStream(filePath);
             Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            int headerRowIndex = findHeaderRow(sheet);
            if (headerRowIndex < 0) {
                throw new RuntimeException("Không tìm thấy dòng tiêu đề (cột #) trong file Excel");
            }

            Map<String, Integer> colMap = buildColumnMap(sheet, headerRowIndex);

            List<DriverUpdate> updates = new ArrayList<>();

            for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell firstCell = row.getCell(getCol(colMap, "#"));
                if (firstCell != null) {
                    String val = getCellStringValue(firstCell);
                    if (val != null && (val.trim().equalsIgnoreCase("TỔNG") || val.trim().toUpperCase().contains("TỔNG"))) {
                        continue;
                    }
                }

                String driverCode = getCellStringValue(row, colMap, "Mã LX");
                if (driverCode == null || driverCode.isEmpty()) continue;

                String fullName = getCellStringValue(row, colMap, "Tên tài xế");
                String cccd = getCellStringValue(row, colMap, "Số CCCD");
                LocalDate birthDate = getDateCellValue(row, colMap, "Ngày sinh");
                BigDecimal deposit = getDecimalCellValue(row, colMap, "Tiền cọc");

                updates.add(new DriverUpdate(driverCode, fullName, cccd, birthDate, deposit));
            }

            result.totalRows = updates.size();

            Map<String, Driver> existingDrivers = new HashMap<>();
            for (Driver d : driverRepository.findByCompanyIdAndDriverCodeIn(
                    company.getId(),
                    updates.stream().map(u -> u.driverCode).toList())) {
                existingDrivers.put(d.getDriverCode(), d);
            }

            for (DriverUpdate update : updates) {
                try {
                    Driver driver = existingDrivers.get(update.driverCode);
                    boolean changed = false;

                    if (driver == null) {
                        driver = Driver.builder()
                                .company(company)
                                .driverCode(update.driverCode)
                                .fullName(update.fullName != null ? update.fullName : update.driverCode)
                                .cccd(update.cccd)
                                .birthDate(update.birthDate)
                                .joinDate(LocalDate.of(2026, 4, 1))
                                .status("active")
                                .depositAmount(update.deposit != null ? update.deposit : BigDecimal.ZERO)
                                .build();
                        driverRepository.save(driver);
                        result.driversCreated++;
                        log.info("Created driver: {} - {}", update.driverCode, update.fullName);
                        changed = true;
                    } else {
                        if (update.birthDate != null && !update.birthDate.equals(driver.getBirthDate())) {
                            driver.setBirthDate(update.birthDate);
                            changed = true;
                        }
                        if (update.fullName != null && !update.fullName.equals(driver.getFullName())) {
                            driver.setFullName(update.fullName);
                            changed = true;
                        }
                        if (update.cccd != null && !update.cccd.isEmpty() && !update.cccd.equals(driver.getCccd())) {
                            driver.setCccd(update.cccd);
                            changed = true;
                        }
                        if (update.deposit != null && update.deposit.compareTo(driver.getDepositAmount()) != 0) {
                            driver.setDepositAmount(update.deposit);
                            changed = true;
                        }
                        if (changed) {
                            driverRepository.save(driver);
                            log.info("Updated driver: {} - {} (birth={}, deposit={})",
                                    update.driverCode, update.fullName, update.birthDate, update.deposit);
                        }
                    }

                    if (changed) {
                        result.updatedRows++;
                    }
                } catch (Exception e) {
                    log.error("Error processing driver {}: {}", update.driverCode, e.getMessage());
                    result.errors.add("Driver " + update.driverCode + ": " + e.getMessage());
                    result.errorRows++;
                }
            }

            workbook.close();
        } catch (IOException e) {
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage(), e);
        }

        log.info("Import result: {} total, {} updated/created, {} errors",
                result.totalRows, result.updatedRows, result.errorRows);
        return result;
    }

    private int findHeaderRow(Sheet sheet) {
        for (int i = 0; i <= 10 && i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row != null) {
                Cell cell = row.getCell(0);
                if (cell != null && cell.getCellType() == CellType.STRING
                        && "#".equals(cell.getStringCellValue().trim())) {
                    return i;
                }
            }
        }
        return -1;
    }

    private Map<String, Integer> buildColumnMap(Sheet sheet, int headerRowIndex) {
        Map<String, Integer> colMap = new HashMap<>();
        Row headerRow = sheet.getRow(headerRowIndex);
        if (headerRow == null) return colMap;
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null && cell.getCellType() == CellType.STRING) {
                colMap.put(cell.getStringCellValue().trim(), i);
            }
        }
        return colMap;
    }

    private int getCol(Map<String, Integer> colMap, String name) {
        Integer idx = colMap.get(name);
        if (idx != null) return idx;
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().trim().equalsIgnoreCase(name.trim())) return entry.getValue();
        }
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().toLowerCase().contains(name.toLowerCase())
                    || name.toLowerCase().contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }
        return -1;
    }

    private String getCellStringValue(Row row, Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return null;
        Cell cell = row.getCell(col);
        return cell != null ? getCellStringValue(cell) : null;
    }

    private String getCellStringValue(Cell cell) {
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

    private LocalDate getDateCellValue(Row row, Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;

        try {
            if (cell.getCellType() == CellType.NUMERIC
                    && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }
        } catch (Exception ignored) {}

        String val = getCellStringValue(cell);
        if (val == null || val.isEmpty()) return null;

        String[] formats = {"dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd", "dd/MM/yyyy HH:mm:ss"};
        for (String fmt : formats) {
            try {
                return LocalDate.parse(val, DateTimeFormatter.ofPattern(fmt));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private BigDecimal getDecimalCellValue(Row row, Map<String, Integer> colMap, String colName) {
        int col = getCol(colMap, colName);
        if (col < 0) return BigDecimal.ZERO;
        Cell cell = row.getCell(col);
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

    private record DriverUpdate(String driverCode, String fullName, String cccd,
                                LocalDate birthDate, BigDecimal deposit) {}

    @lombok.Data
    public static class ImportResult {
        private int totalRows;
        private int updatedRows;
        private int driversCreated;
        private int errorRows;
        private List<String> errors = new ArrayList<>();
    }
}
