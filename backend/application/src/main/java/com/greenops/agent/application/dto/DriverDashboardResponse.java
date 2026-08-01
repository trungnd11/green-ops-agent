package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDashboardResponse {
    private String driverCode;
    private String fullName;
    private String phone;

    private BigDecimal xanhBalance;
    private BigDecimal depositIn;
    private BigDecimal withdrawn;
    private BigDecimal availableBalance;
    private BigDecimal totalBalance;

    private String latestPeriod;
    private BigDecimal latestRevenue;
    private Integer latestTrips;

    private List<TransactionItem> recentTransactions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionItem {
        private String transactionCode;
        private String transactionType;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
        private String status;
        private String note;
        private String createdAt;
    }
}
