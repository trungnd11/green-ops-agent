package com.greenops.agent.application.dto.iam.catalog;

import com.greenops.agent.domain.iam.PermissionType;
import com.greenops.agent.domain.iam.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PermissionRequest(@NotNull UUID moduleId, @NotBlank String code, @NotBlank String name, String description, @NotBlank String resource, @NotBlank String action, @NotNull PermissionType permissionType, Status status) {}
