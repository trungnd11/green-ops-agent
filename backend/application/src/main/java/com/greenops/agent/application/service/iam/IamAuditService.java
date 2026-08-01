package com.greenops.agent.application.service.iam;

import java.util.UUID;

public interface IamAuditService {
    void record(String action, String entityType, UUID entityId, UUID companyId);
    default void record(String action, String entityType, UUID entityId, UUID actorUserId, UUID companyId, Object oldData, Object newData) {
        record(action, entityType, entityId, companyId);
    }
}
