package com.greenops.agent.application.security;

import java.util.UUID;

public interface AuditMetadataProvider {
    AuditMetadata current();

    record AuditMetadata(UUID actorUserId, String ipAddress, String userAgent) {}
}
