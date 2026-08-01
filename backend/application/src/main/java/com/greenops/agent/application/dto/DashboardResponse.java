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
public class DashboardResponse {
    private long totalDrivers;
    private long activeDrivers;
    private long resignedDrivers;
    private long totalPeriods;
    private BigDecimal totalRevenueCurrentPeriod;
    private BigDecimal totalDeductionCurrentPeriod;
    private BigDecimal totalAdditionCurrentPeriod;
    private BigDecimal totalPayoutCurrentPeriod;
    private int totalTripsCurrentPeriod;
    private RevenuePeriodInfo currentPeriod;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenuePeriodInfo {
        private UUID id;
        private String name;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String status;
    }
}
