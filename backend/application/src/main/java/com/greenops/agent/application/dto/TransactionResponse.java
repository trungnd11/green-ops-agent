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
public class TransactionResponse {
    private UUID id;
    private String transactionCode;
    private String transactionType;
    private BigDecimal amount;
    private String status;
    private String rejectReason;
    private String note;
    private UUID driverId;
    private String driverCode;
    private String driverName;
    private LocalDateTime createdAt;
}
