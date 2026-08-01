package com.greenops.agent.application.dto.iam.membership;

import com.greenops.agent.domain.iam.MembershipStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record UpdateMembershipRequest(String employeeCode, String jobTitle, @NotNull MembershipStatus status, LocalDateTime effectiveFrom, LocalDateTime effectiveTo) {}
