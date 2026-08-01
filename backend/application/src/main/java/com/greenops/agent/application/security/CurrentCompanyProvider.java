package com.greenops.agent.application.security;

import java.util.Optional;
import java.util.UUID;

public interface CurrentCompanyProvider {
    Optional<UUID> getCurrentCompanyId();

    default UUID requireCurrentCompanyId() {
        return getCurrentCompanyId().orElseThrow(() -> new IllegalStateException("Current company is not available"));
    }
}
