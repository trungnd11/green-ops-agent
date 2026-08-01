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
public class RevenuePeriodResponse {
    private UUID id;
    private String name;
    private String type;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String source;
    private String status;
    private String note;
    private Long driverCount;
    private BigDecimal totalRevenue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
