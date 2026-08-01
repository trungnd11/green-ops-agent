package com.greenops.agent.application.dto.iam.me;

import java.util.UUID;

public record CurrentCompanyResponse(UUID id, String code, String name, boolean defaultCompany) {}
