package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private UUID id;
    private String action;
    private String entityType;
    private UUID entityId;
    private String actorName;
    private Map<String, Object> oldData;
    private Map<String, Object> newData;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
