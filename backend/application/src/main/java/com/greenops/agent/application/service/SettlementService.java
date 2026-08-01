package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.SettlementDetailResponse;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final SettlementDetailRepository settlementDetailRepository;
    private final RevenueDetailRepository revenueDetailRepository;
    private final RevenuePeriodRepository periodRepository;
    private final CompanyRepository companyRepository;
    private final TransactionRepository transactionRepository;
    private final DriverRepository driverRepository;

    public PageResponse<Settlement> getSettlements(UUID companyId, Pageable pageable) {
        Page<Settlement> page = settlementRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable);
        return PageResponse.<Settlement>builder()
                .items(page.getContent()).page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }

    public Settlement getSettlement(UUID companyId, UUID settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Quyết toán", settlementId));
        if (!settlement.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Quyết toán", settlementId);
        }
        return settlement;
    }

    public List<SettlementDetailResponse> getSettlementDetails(UUID companyId, UUID settlementId) {
        Settlement settlement = getSettlement(companyId, settlementId);
        return settlementDetailRepository.findBySettlementId(settlementId)
                .stream()
                .map(sd -> SettlementDetailResponse.builder()
                        .id(sd.getId())
                        .driverId(sd.getDriver().getId())
                        .driverCode(sd.getDriver().getDriverCode())
                        .driverName(sd.getDriver().getFullName())
                        .grossRevenue(sd.getGrossRevenue())
                        .totalDeduction(sd.getTotalDeduction())
                        .totalAddition(sd.getTotalAddition())
                        .netPayable(sd.getNetPayable())
                        .currentDeposit(sd.getCurrentDeposit())
                        .note(sd.getNote())
                        .build())
                .toList();
    }

    @Transactional
    public Settlement createSettlement(UUID companyId, UUID periodId, UUID userId) {
        // Kiểm tra period
        RevenuePeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ báo cáo", periodId));
        if (!period.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Kỳ báo cáo", periodId);
        }
        if (!"verified".equals(period.getStatus())) {
            throw new BusinessException("Kỳ báo cáo chưa được xác nhận (cần ở trạng thái 'verified')");
        }

        // Kiểm tra đã có quyết toán chưa
        if (settlementRepository.existsByCompanyIdAndPeriodId(companyId, periodId)) {
            throw new BusinessException("Kỳ báo cáo này đã được quyết toán");
        }

        Company company = period.getCompany();

        // Lấy tất cả revenue detail
        List<RevenueDetail> details = revenueDetailRepository.findByPeriodId(periodId);
        if (details.isEmpty()) {
            throw new BusinessException("Không có dữ liệu doanh thu để quyết toán");
        }

        // Tính tổng
        BigDecimal totalRevenue = details.stream()
                .map(RevenueDetail::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDeduction = details.stream()
                .map(RevenueDetail::getTotalDeduction)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAddition = details.stream()
                .map(RevenueDetail::getTotalAddition)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPayout = details.stream()
                .map(RevenueDetail::getEarnedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tạo settlement
        String settlementCode = "STL-" + company.getCode() + "-" + period.getStartDate().toString().replace("-", "");

        Settlement settlement = Settlement.builder()
                .company(company)
                .period(period)
                .settlementCode(settlementCode)
                .totalDrivers(details.size())
                .totalRevenue(totalRevenue)
                .totalDeduction(totalDeduction)
                .totalAddition(totalAddition)
                .totalPayout(totalPayout)
                .status("draft")
                .createdBy(userId)
                .build();
        settlement = settlementRepository.save(settlement);

        // Tạo settlement details
        for (RevenueDetail detail : details) {
            SettlementDetail sd = SettlementDetail.builder()
                    .settlement(settlement)
                    .driver(detail.getDriver())
                    .revenueDetail(detail)
                    .grossRevenue(detail.getTotalRevenue())
                    .totalDeduction(detail.getTotalDeduction())
                    .totalAddition(detail.getTotalAddition())
                    .netPayable(detail.getEarnedAmount())
                    .currentDeposit(detail.getDriver().getDepositAmount())
                    .build();
            settlementDetailRepository.save(sd);
        }

        log.info("Created settlement: {} with {} drivers, total payout: {}",
                settlementCode, details.size(), totalPayout);
        return settlement;
    }

    @Transactional
    public Settlement approveSettlement(UUID companyId, UUID settlementId, UUID userId) {
        Settlement settlement = getSettlement(companyId, settlementId);
        if (!"draft".equals(settlement.getStatus()) && !"pending".equals(settlement.getStatus())) {
            throw new BusinessException("Quyết toán ở trạng thái " + settlement.getStatus() + ", không thể phê duyệt");
        }

        settlement.setStatus("approved");
        settlement.setApprovedBy(userId);
        settlement.setApprovedAt(LocalDateTime.now());
        settlement = settlementRepository.save(settlement);

        log.info("Approved settlement: {}", settlement.getSettlementCode());
        return settlement;
    }

    @Transactional
    public Settlement confirmPaid(UUID companyId, UUID settlementId) {
        Settlement settlement = getSettlement(companyId, settlementId);
        if (!"approved".equals(settlement.getStatus())) {
            throw new BusinessException("Quyết toán chưa được phê duyệt");
        }

        settlement.setStatus("paid");
        settlement = settlementRepository.save(settlement);

        // Đóng kỳ báo cáo
        RevenuePeriod period = settlement.getPeriod();
        period.setStatus("closed");
        periodRepository.save(period);

        // Tạo transactions cho từng tài xế
        List<SettlementDetail> details = settlementDetailRepository.findBySettlementId(settlementId);
        for (SettlementDetail detail : details) {
            Transaction tx = Transaction.builder()
                    .driver(detail.getDriver())
                    .transactionCode("PAY-" + settlement.getSettlementCode() + "-" + detail.getDriver().getDriverCode())
                    .transactionType("revenue")
                    .amount(detail.getNetPayable())
                    .balanceBefore(detail.getDriver().getDepositAmount())
                    .balanceAfter(detail.getDriver().getDepositAmount().add(detail.getNetPayable()))
                    .referenceType("settlement")
                    .referenceId(settlementId)
                    .note("Thanh toán quyết toán kỳ " + settlement.getPeriod().getName())
                    .build();
            transactionRepository.save(tx);
        }

        log.info("Paid settlement: {}", settlement.getSettlementCode());
        return settlement;
    }
}
