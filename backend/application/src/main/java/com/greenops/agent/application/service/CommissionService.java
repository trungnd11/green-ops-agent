package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.*;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.application.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionService {

    private final CommissionLogRepository commissionLogRepository;
    private final CommissionConfigRepository commissionConfigRepository;
    private final RevenuePeriodRepository revenuePeriodRepository;
    private final RevenueDetailRepository revenueDetailRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final UserTransactionRepository userTransactionRepository;

    public PageResponse<CommissionLogResponse> getPendingCommissions(UUID periodId, String status, Pageable pageable) {
        Page<CommissionLog> page;
        if (periodId != null) {
            page = commissionLogRepository.findByPeriodIdAndStatus(periodId, status, pageable);
        } else {
            page = commissionLogRepository.findByStatus(status, pageable);
        }
        return PageResponse.<CommissionLogResponse>builder()
                .items(page.getContent().stream().map(this::toCommissionLogResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional
    public void calculateCommissions(UUID periodId) {
        RevenuePeriod period = revenuePeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ doanh thu", periodId));

        if (!"daily".equals(period.getType())) {
            throw new BusinessException("Chỉ hỗ trợ tính hoa hồng cho kỳ doanh thu hàng ngày");
        }

        var revenueDetails = revenueDetailRepository.findByPeriodId(periodId);
        int count = 0;

        for (var detail : revenueDetails) {
            Driver driver = detail.getDriver();
            if (driver.getReferrer() == null) continue;

            if (commissionLogRepository.findByPeriodIdAndDriverId(periodId, driver.getId()).isPresent()) continue;

            BigDecimal rate = resolveCommissionRate(driver.getReferrer().getId(), driver.getId());
            if (rate == null) continue;

            BigDecimal commission = detail.getTotalRevenue()
                    .multiply(rate)
                    .divide(BigDecimal.valueOf(100));

            CommissionLog log = CommissionLog.builder()
                    .period(period)
                    .driver(driver)
                    .referrer(driver.getReferrer())
                    .revenueAmount(detail.getTotalRevenue())
                    .rate(rate)
                    .commissionAmount(commission)
                    .status("PENDING")
                    .build();
            commissionLogRepository.save(log);
            count++;
        }
        log.info("Calculated commissions for period {}: {} records", periodId, count);
    }

    private BigDecimal resolveCommissionRate(UUID userId, UUID driverId) {
        var byDriver = commissionConfigRepository.findByDriverId(driverId);
        if (byDriver.isPresent()) return byDriver.get().getRate();

        var byUser = commissionConfigRepository.findByUserIdOnly(userId);
        if (byUser.isPresent()) return byUser.get().getRate();

        var global = commissionConfigRepository.findGlobal();
        if (global.isPresent()) return global.get().getRate();

        return null;
    }

    @Transactional
    public void reviewCommission(UUID commissionId, CommissionReviewRequest request, UUID reviewerId) {
        CommissionLog log = commissionLogRepository.findById(commissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Hoa hồng", commissionId));

        if (!"PENDING".equals(log.getStatus())) {
            throw new BusinessException("Hoa hồng đã được xử lý trước đó");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", reviewerId));

        switch (request.getAction()) {
            case "approve" -> approveCommission(log, reviewer);
            case "adjust" -> adjustAndApprove(log, request, reviewer);
            case "reject" -> rejectCommission(log, request, reviewer);
            default -> throw new BusinessException("Hành động không hợp lệ: " + request.getAction());
        }
    }

    private void approveCommission(CommissionLog log, User reviewer) {
        log.setStatus("APPROVED");
        log.setReviewedBy(reviewer);
        log.setReviewedAt(LocalDateTime.now());
        commissionLogRepository.save(log);
        createCommissionTransaction(log);
    }

    private void adjustAndApprove(CommissionLog log, CommissionReviewRequest request, User reviewer) {
        if (request.getAdjustedAmount() == null || request.getAdjustedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền hoa hồng không hợp lệ");
        }
        log.setOriginalAmount(log.getCommissionAmount());
        log.setCommissionAmount(request.getAdjustedAmount());
        log.setAdjustReason(request.getReason());
        log.setStatus("APPROVED");
        log.setReviewedBy(reviewer);
        log.setReviewedAt(LocalDateTime.now());
        commissionLogRepository.save(log);
        createCommissionTransaction(log);
    }

    private void rejectCommission(CommissionLog log, CommissionReviewRequest request, User reviewer) {
        log.setStatus("REJECTED");
        log.setReviewedBy(reviewer);
        log.setReviewedAt(LocalDateTime.now());
        log.setRejectReason(request.getReason());
        commissionLogRepository.save(log);
    }

    private void createCommissionTransaction(CommissionLog log) {
        BigDecimal balanceBefore = userTransactionRepository.calculateAvailableBalance(log.getReferrer().getId());
        if (balanceBefore == null) balanceBefore = BigDecimal.ZERO;

        String txCode = "CM" + System.currentTimeMillis();

        UserTransaction tx = UserTransaction.builder()
                .user(log.getReferrer())
                .transactionCode(txCode)
                .transactionType("commission")
                .amount(log.getCommissionAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceBefore.add(log.getCommissionAmount()))
                .referenceType("commission")
                .referenceId(log.getId())
                .status("APPROVED")
                .createdBy(log.getReferrer())
                .build();
        userTransactionRepository.save(tx);
    }

    private CommissionLogResponse toCommissionLogResponse(CommissionLog log) {
        return CommissionLogResponse.builder()
                .id(log.getId())
                .periodId(log.getPeriod().getId())
                .periodName(log.getPeriod().getName())
                .driverId(log.getDriver().getId())
                .driverCode(log.getDriver().getDriverCode())
                .driverName(log.getDriver().getFullName())
                .referrerId(log.getReferrer().getId())
                .referrerName(log.getReferrer().getFullName())
                .revenueAmount(log.getRevenueAmount())
                .rate(log.getRate())
                .commissionAmount(log.getCommissionAmount())
                .originalAmount(log.getOriginalAmount())
                .adjustReason(log.getAdjustReason())
                .status(log.getStatus())
                .reviewedByName(log.getReviewedBy() != null ? log.getReviewedBy().getFullName() : null)
                .reviewedAt(log.getReviewedAt())
                .rejectReason(log.getRejectReason())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
