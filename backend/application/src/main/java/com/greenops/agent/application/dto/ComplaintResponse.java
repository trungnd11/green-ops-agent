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
public class ComplaintResponse {
    private UUID id;
    private UUID driverId;
    private String driverName;
    private String driverCode;
    private UUID settlementId;
    private String settlementCode;
    private String code;
    private String category;
    private String title;
    private String description;
    private BigDecimal amount;
    private String evidence;
    private String status;
    private String response;
    private String respondedByName;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;
}
