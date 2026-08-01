package com.greenops.agent.application.dto.iam.me;

import java.util.List;

public record CurrentPermissionsResponse(List<String> roles, List<String> permissions) {}
