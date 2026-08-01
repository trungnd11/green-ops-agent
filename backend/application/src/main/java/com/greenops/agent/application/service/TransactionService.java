package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.TransactionResponse;
import com.greenops.agent.domain.RevenueDetail;
import com.greenops.agent.domain.RevenuePeriod;
import com.greenops.agent.domain.Transaction;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.RevenueDetailRepository;
import com.greenops.agent.domain.RevenuePeriodRepository;
import com.greenops.agent.domain.TransactionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final RevenueDetailRepository revenueDetailRepository;
    private final RevenuePeriodRepository periodRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> listTransactions(String type, String status, String keyword,
                                                                LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null && !type.isEmpty()) {
                predicates.add(cb.equal(root.get("transactionType"), type));
            }
            if (status != null && !status.isEmpty() && !"all".equals(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (keyword != null && !keyword.isBlank()) {
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("driver").get("driverCode")), "%" + keyword.toLowerCase() + "%"),
                        cb.like(cb.lower(root.get("driver").get("fullName")), "%" + keyword.toLowerCase() + "%")
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transaction> pageResult = transactionRepository.findAll(spec, pageable);
        return PageResponse.<TransactionResponse>builder()
                .items(pageResult.getContent().stream().map(this::toResponse).toList())
                .page(pageResult.getNumber()).size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements()).totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst()).last(pageResult.isLast()).build();
    }

    @Transactional
    public void approve(UUID transactionId, UUID adminId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dich", transactionId));

        if (!"PENDING".equals(tx.getStatus())) {
            throw new BusinessException("Giao dich da duoc xu ly");
        }

        // Cap nhat so du trong ky hien tai
        var periods = periodRepository.findByCompanyIdOrderByStartDateDesc(
                tx.getDriver().getCompany().getId(), PageRequest.of(0, 1));
        if (!periods.getContent().isEmpty()) {
            RevenuePeriod latestPeriod = periods.getContent().get(0);
            RevenueDetail detail = revenueDetailRepository
                    .findByPeriodIdAndDriverId(latestPeriod.getId(), tx.getDriver().getId())
                    .orElse(null);

            if (detail == null) {
                detail = RevenueDetail.builder()
                        .period(latestPeriod)
                        .driver(tx.getDriver())
                        .availableBalance(java.math.BigDecimal.ZERO)
                        .totalBalance(java.math.BigDecimal.ZERO)
                        .totalRevenue(java.math.BigDecimal.ZERO)
                        .totalTrips(0)
                        .depositIn(java.math.BigDecimal.ZERO)
                        .withdrawn(java.math.BigDecimal.ZERO)
                        .build();
            }
            BigDecimal newBalance = detail.getAvailableBalance().add(tx.getAmount());
            detail.setAvailableBalance(newBalance);
            detail.setTotalBalance(detail.getTotalBalance().add(tx.getAmount()));

            if ("topup".equals(tx.getTransactionType())) {
                detail.setDepositIn(detail.getDepositIn().add(tx.getAmount()));
            } else if ("withdraw".equals(tx.getTransactionType())) {
                detail.setWithdrawn(detail.getWithdrawn().add(tx.getAmount().abs()));
            }

            revenueDetailRepository.save(detail);
        }

        tx.setStatus("APPROVED");
        tx.setProcessedBy(adminId);
        tx.setProcessedAt(LocalDateTime.now());
        transactionRepository.save(tx);

        log.info("Transaction {} approved by admin {}", tx.getTransactionCode(), adminId);

        UUID driverId = tx.getDriver() != null ? tx.getDriver().getId() : null;
        if (driverId != null) {
            String type = "withdraw".equals(tx.getTransactionType()) ? "withdrawal_approved" : "topup_approved";
            notificationService.create(driverId, type,
                    "Giao dịch đã được duyệt",
                    "Giao dịch " + tx.getTransactionCode() + " đã được duyệt thành công.",
                    "transaction", tx.getId());
        }
    }

    @Transactional
    public void reject(UUID transactionId, UUID adminId, String reason) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dich", transactionId));

        if (!"PENDING".equals(tx.getStatus())) {
            throw new BusinessException("Giao dich da duoc xu ly");
        }

        tx.setStatus("REJECTED");
        tx.setProcessedBy(adminId);
        tx.setProcessedAt(LocalDateTime.now());
        tx.setRejectReason(reason);
        transactionRepository.save(tx);

        log.info("Transaction {} rejected by admin {} reason: {}", tx.getTransactionCode(), adminId, reason);

        UUID driverId = tx.getDriver() != null ? tx.getDriver().getId() : null;
        if (driverId != null) {
            notificationService.create(driverId, "withdrawal_rejected",
                    "Giao dịch bị từ chối",
                    "Giao dịch " + tx.getTransactionCode() + " bị từ chối. Lý do: " + (reason != null ? reason : ""),
                    "transaction", tx.getId());
        }
    }

    private String cleanNote(String note) {
        if (note == null) return null;
        return note
                .replaceAll("Náº¡p tiá»n", "Nap tien")
                .replaceAll("Chuyá»ƒn khoáº£n", "Chuyen khoan")
                .replaceAll("YÃªu cáº§u rÃºt", "Yeu cau rut");
    }

    private TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .transactionCode(tx.getTransactionCode())
                .transactionType(tx.getTransactionType())
                .amount(tx.getAmount())
                .status(tx.getStatus())
                .rejectReason(tx.getRejectReason())
                .note(cleanNote(tx.getNote()))
                .driverId(tx.getDriver() != null ? tx.getDriver().getId() : null)
                .driverCode(tx.getDriver() != null ? tx.getDriver().getDriverCode() : null)
                .driverName(tx.getDriver() != null ? tx.getDriver().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
