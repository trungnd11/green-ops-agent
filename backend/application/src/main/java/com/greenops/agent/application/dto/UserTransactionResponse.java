package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTransactionResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private String transactionCode;
    private String transactionType;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String bankName;
    private String bankAccount;
    private String bankHolder;
    private String status;
    private String rejectReason;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private LocalDateTime paidAt;
}
