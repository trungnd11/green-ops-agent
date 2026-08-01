package com.greenops.agent.application.service.iam;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenops.agent.application.security.AuditMetadataProvider;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.User;
import com.greenops.agent.domain.iam.AuthorizationAuditLog;
import com.greenops.agent.domain.iam.AuthorizationAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthorizationAuditService implements IamAuditService {
    private static final int IP_LIMIT = 45;
    private static final int USER_AGENT_LIMIT = 1024;
    private static final Set<String> DENIED = Set.of("password", "passwordHash", "refreshToken", "token", "secret", "authorization");
    private final AuthorizationAuditLogRepository repository;
    private final AuditMetadataProvider metadataProvider;
    private final ObjectMapper objectMapper;

    @Override
    public void record(String action, String entityType, UUID entityId, UUID companyId) {
        record(action, entityType, entityId, null, companyId, null, null);
    }

    public void record(String action, String entityType, UUID entityId, UUID actorUserId, UUID companyId, Object oldData, Object newData) {
        AuditMetadataProvider.AuditMetadata metadata = metadataProvider.current();
        UUID actor = actorUserId == null ? metadata.actorUserId() : actorUserId;
        repository.save(AuthorizationAuditLog.builder()
                .action(action).entityType(entityType).entityId(entityId)
                .actorUser(actor == null ? null : User.builder().id(actor).build())
                .company(companyId == null ? null : Company.builder().id(companyId).build())
                .oldData(snapshot(oldData)).newData(snapshot(newData))
                .ipAddress(bound(metadata.ipAddress(), IP_LIMIT)).userAgent(bound(metadata.userAgent(), USER_AGENT_LIMIT))
                .build());
    }

    private Map<String, Object> snapshot(Object value) {
        if (value == null) return null;
        Map<String, Object> converted = objectMapper.convertValue(value, new TypeReference<>() {});
        LinkedHashMap<String, Object> safe = new LinkedHashMap<>();
        converted.forEach((key, item) -> { if (DENIED.stream().noneMatch(denied -> denied.equalsIgnoreCase(key))) safe.put(key, item); });
        return Collections.unmodifiableMap(safe);
    }

    private String bound(String value, int limit) {
        return value == null || value.length() <= limit ? value : value.substring(0, limit);
    }
}
