package com.greenops.agent.application.dto.iam.role;

import com.greenops.agent.domain.iam.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(@NotBlank String name, String description, @NotNull Status status) {}
