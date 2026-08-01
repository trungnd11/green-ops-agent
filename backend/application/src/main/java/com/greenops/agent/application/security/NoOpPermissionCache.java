package com.greenops.agent.application.security;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
public class NoOpPermissionCache implements PermissionCache {
    public Optional<Set<String>> get(UUID userId, UUID companyId) {
        return Optional.empty();
    }

    public void put(UUID userId, UUID companyId, Set<String> permissions) {
    }

    public void evict(UUID userId, UUID companyId) {
    }
}
