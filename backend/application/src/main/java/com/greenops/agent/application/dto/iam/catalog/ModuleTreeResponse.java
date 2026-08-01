package com.greenops.agent.application.dto.iam.catalog;

import com.greenops.agent.domain.iam.ModuleType;
import com.greenops.agent.domain.iam.Status;
import java.util.List;
import java.util.UUID;

public record ModuleTreeResponse(UUID id, String code, String name, String description, UUID parentId, ModuleType moduleType, String route, String icon, int displayOrder, Status status, List<ModuleTreeResponse> children) {}
