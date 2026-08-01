package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementDetailResponse {
    private UUID id;
    private UUID driverId;
    private String driverCode;
    private String driverName;
    private BigDecimal grossRevenue;
    private BigDecimal totalDeduction;
    private BigDecimal totalAddition;
    private BigDecimal netPayable;
    private BigDecimal currentDeposit;
    private String note;
}
