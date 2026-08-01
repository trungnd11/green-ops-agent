package com.greenops.agent.application.security;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface PermissionCache {
    Optional<Set<String>> get(UUID userId, UUID companyId);
    void put(UUID userId, UUID companyId, Set<String> permissions);
    void evict(UUID userId, UUID companyId);
}
