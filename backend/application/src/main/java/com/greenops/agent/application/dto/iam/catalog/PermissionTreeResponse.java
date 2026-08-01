package com.greenops.agent.application.dto.iam.catalog;

import java.util.List;
import java.util.UUID;

public record PermissionTreeResponse(UUID moduleId, String moduleCode, String moduleName, List<PermissionResponse> permissions, List<PermissionTreeResponse> children) {}
