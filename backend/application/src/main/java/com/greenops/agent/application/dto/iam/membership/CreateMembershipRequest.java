package com.greenops.agent.application.dto.iam.membership;

import com.greenops.agent.domain.iam.MembershipStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record CreateMembershipRequest(@NotNull UUID userId, String employeeCode, String jobTitle, MembershipStatus status, LocalDateTime effectiveFrom, LocalDateTime effectiveTo, Set<UUID> roleIds) {}
