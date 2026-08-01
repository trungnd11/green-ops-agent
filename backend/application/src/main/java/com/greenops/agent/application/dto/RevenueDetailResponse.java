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
public class RevenueDetailResponse {
    private UUID id;
    private UUID driverId;
    private String driverCode;
    private String driverName;

    private BigDecimal totalRevenue;
    private Integer totalTrips;

    private BigDecimal insuranceFee;
    private BigDecimal nonCashFee;
    private BigDecimal discountTax;
    private BigDecimal penalty;
    private BigDecimal otherCost;
    private BigDecimal surcharge;

    private BigDecimal bonus;
    private BigDecimal otherIncome;
    private BigDecimal tip;
    private BigDecimal promotion;
    private BigDecimal chargeRefund;

    private BigDecimal xanhBalance;
    private BigDecimal depositIn;
    private BigDecimal withdrawn;
    private BigDecimal availableBalance;
    private BigDecimal totalBalance;

    private BigDecimal totalDeduction;
    private BigDecimal totalAddition;
    private BigDecimal earnedAmount;

    private String note;
}
