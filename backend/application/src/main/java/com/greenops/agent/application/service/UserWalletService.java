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
public class UserWalletService {

    private final UserTransactionRepository userTransactionRepository;
    private final UserRepository userRepository;

    public UserBalanceResponse getBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));
        BigDecimal balance = userTransactionRepository.calculateAvailableBalance(userId);
        if (balance == null) balance = BigDecimal.ZERO;
        return UserBalanceResponse.builder()
                .userId(userId)
                .userName(user.getFullName())
                .availableBalance(balance)
                .build();
    }

    public PageResponse<UserTransactionResponse> getTransactions(UUID userId, Pageable pageable) {
        Page<UserTransaction> page = userTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return toPageResponse(page);
    }

    public PageResponse<UserTransactionResponse> getPendingWithdrawals(Pageable pageable) {
        Page<UserTransaction> page = userTransactionRepository.findByStatus("PENDING", pageable);
        return toPageResponse(page);
    }

    @Transactional
    public UserTransactionResponse requestWithdraw(UUID userId, UserWithdrawRequest request, UUID createdBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        BigDecimal balance = userTransactionRepository.calculateAvailableBalance(userId);
        if (balance == null) balance = BigDecimal.ZERO;

        if (request.getAmount().compareTo(balance) > 0) {
            throw new BusinessException("Số dư không đủ để rút");
        }

        String txCode = "WD" + System.currentTimeMillis();

        UserTransaction tx = UserTransaction.builder()
                .user(user)
                .transactionCode(txCode)
                .transactionType("withdrawal")
                .amount(request.getAmount().negate())
                .balanceBefore(balance)
                .balanceAfter(balance.subtract(request.getAmount()))
                .bankName(request.getBankName())
                .bankAccount(request.getBankAccount())
                .bankHolder(request.getBankHolder())
                .status("PENDING")
                .note(request.getNote())
                .createdBy(userRepository.findById(createdBy)
                        .orElseThrow(() -> new ResourceNotFoundException("Người dùng", createdBy)))
                .build();
        userTransactionRepository.save(tx);
        return toResponse(tx);
    }

    @Transactional
    public void approveWithdrawal(UUID transactionId, UUID adminId) {
        UserTransaction tx = userTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch", transactionId));

        if (!"PENDING".equals(tx.getStatus()) || !"withdrawal".equals(tx.getTransactionType())) {
            throw new BusinessException("Giao dịch không hợp lệ hoặc đã được xử lý");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", adminId));

        tx.setStatus("APPROVED");
        tx.setProcessedBy(admin);
        tx.setProcessedAt(LocalDateTime.now());
        userTransactionRepository.save(tx);
    }

    @Transactional
    public void rejectWithdrawal(UUID transactionId, UUID adminId, String reason) {
        UserTransaction tx = userTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch", transactionId));

        if (!"PENDING".equals(tx.getStatus())) {
            throw new BusinessException("Giao dịch đã được xử lý");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", adminId));

        tx.setStatus("REJECTED");
        tx.setProcessedBy(admin);
        tx.setProcessedAt(LocalDateTime.now());
        tx.setRejectReason(reason);
        userTransactionRepository.save(tx);
    }

    private PageResponse<UserTransactionResponse> toPageResponse(Page<UserTransaction> page) {
        return PageResponse.<UserTransactionResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private UserTransactionResponse toResponse(UserTransaction tx) {
        return UserTransactionResponse.builder()
                .id(tx.getId())
                .userId(tx.getUser().getId())
                .userName(tx.getUser().getFullName())
                .transactionCode(tx.getTransactionCode())
                .transactionType(tx.getTransactionType())
                .amount(tx.getAmount())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .bankName(tx.getBankName())
                .bankAccount(tx.getBankAccount())
                .bankHolder(tx.getBankHolder())
                .status(tx.getStatus())
                .rejectReason(tx.getRejectReason())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .processedAt(tx.getProcessedAt())
                .paidAt(tx.getPaidAt())
                .build();
    }
}
