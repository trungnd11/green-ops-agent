package com.greenops.agent.application.dto.iam.role;

import java.util.UUID;

public record RoleUserResponse(UUID userId, String username, String fullName, String email) {}
