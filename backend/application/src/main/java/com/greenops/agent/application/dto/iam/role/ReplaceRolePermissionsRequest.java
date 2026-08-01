package com.greenops.agent.application.dto.iam.role;

import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.UUID;

public record ReplaceRolePermissionsRequest(@NotNull Set<UUID> permissionIds) {}
