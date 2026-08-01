package com.greenops.agent.application.dto.iam.membership;

import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.UUID;

public record ReplaceMembershipRolesRequest(@NotNull Set<UUID> roleIds) {}
