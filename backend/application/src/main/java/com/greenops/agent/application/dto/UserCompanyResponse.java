package com.greenops.agent.application.dto;

import java.util.UUID;

public record UserCompanyResponse(UUID companyId, String companyCode, String companyName, boolean defaultCompany, boolean active) {}
