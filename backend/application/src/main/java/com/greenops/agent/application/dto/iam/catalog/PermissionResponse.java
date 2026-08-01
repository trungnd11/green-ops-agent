package com.greenops.agent.application.dto.iam.catalog;

import com.greenops.agent.domain.iam.PermissionType;
import com.greenops.agent.domain.iam.Status;
import java.util.UUID;

public record PermissionResponse(UUID id, UUID moduleId, String moduleCode, String code, String name, String description, String resource, String action, PermissionType permissionType, Status status) {}
