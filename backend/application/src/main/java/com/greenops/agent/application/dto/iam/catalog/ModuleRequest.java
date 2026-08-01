package com.greenops.agent.application.dto.iam.catalog;

import com.greenops.agent.domain.iam.ModuleType;
import com.greenops.agent.domain.iam.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ModuleRequest(@NotBlank String code, @NotBlank String name, String description, UUID parentId, @NotNull ModuleType moduleType, String route, String icon, Integer displayOrder, Status status) {}
