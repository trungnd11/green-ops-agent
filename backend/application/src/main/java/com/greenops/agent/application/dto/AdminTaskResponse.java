package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTaskResponse {
    private UUID id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private UUID assigneeId;
    private String assigneeName;
    private String referenceType;
    private UUID referenceId;
    private LocalDate dueDate;
    private String createdByName;
    private LocalDateTime createdAt;
}
