package com.greenops.agent.application.dto.iam.membership;

import com.greenops.agent.domain.iam.MembershipStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MembershipResponse(UUID id, UUID userId, String username, String fullName, String email, String employeeCode, String jobTitle, MembershipStatus status, LocalDateTime effectiveFrom, LocalDateTime effectiveTo, List<RoleItem> roles) {
    public record RoleItem(UUID id, String code, String name) {}
}
