package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTaskRequest {
    private String title;
    private String description;
    private String priority;
    private UUID assigneeId;
    private String referenceType;
    private UUID referenceId;
    private LocalDate dueDate;
}
