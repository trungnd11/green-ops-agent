package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.security.PermissionCache;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Collection;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PermissionCacheInvalidator {
    private final PermissionCache cache;

    public void evictAfterCommit(UUID userId, UUID companyId) {
        afterCommit(() -> cache.evict(userId, companyId));
    }

    public void evictAfterCommit(Collection<UUID> userIds, UUID companyId) {
        var snapshot = userIds == null ? java.util.Set.<UUID>of() : java.util.Set.copyOf(userIds);
        afterCommit(() -> snapshot.forEach(userId -> cache.evict(userId, companyId)));
    }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { action.run(); }
        });
    }
}
