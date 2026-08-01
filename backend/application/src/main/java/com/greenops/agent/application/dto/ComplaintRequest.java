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
public class ComplaintRequest {
    private UUID driverId;
    private UUID settlementId;
    private String category;
    private String title;
    private String description;
    private BigDecimal amount;
    private String evidence;
}
