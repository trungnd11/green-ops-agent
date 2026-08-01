package com.greenops.agent.application.dto.iam.role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.UUID;

public record CreateRoleRequest(@NotBlank String code, @NotBlank String name, String description, @NotNull Set<UUID> permissionIds) {}
