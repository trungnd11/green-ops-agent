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
public class CommissionLogResponse {
    private UUID id;
    private UUID periodId;
    private String periodName;
    private UUID driverId;
    private String driverCode;
    private String driverName;
    private UUID referrerId;
    private String referrerName;
    private BigDecimal revenueAmount;
    private BigDecimal rate;
    private BigDecimal commissionAmount;
    private BigDecimal originalAmount;
    private String adjustReason;
    private String status;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String rejectReason;
    private LocalDateTime createdAt;
}
