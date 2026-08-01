package com.greenops.agent.application.dto.iam.role;

import com.greenops.agent.domain.iam.Status;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RoleResponse(UUID id, UUID companyId, String code, String name, String description, Status status, LocalDateTime createdAt, List<PermissionItem> permissions) {
    public record PermissionItem(UUID id, String code, String name) {}
}
