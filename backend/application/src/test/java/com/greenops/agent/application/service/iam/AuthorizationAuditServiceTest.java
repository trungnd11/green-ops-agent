package com.greenops.agent.application.service.iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenops.agent.application.security.AuditMetadataProvider;
import com.greenops.agent.domain.iam.AuthorizationAuditLog;
import com.greenops.agent.domain.iam.AuthorizationAuditLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthorizationAuditServiceTest {
    @Test
    void recordsAllowlistedImmutableSnapshotsAndBoundedMetadata() {
        AuthorizationAuditLogRepository repository = mock(AuthorizationAuditLogRepository.class);
        UUID actorId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        AuditMetadataProvider metadata = () -> new AuditMetadataProvider.AuditMetadata(actorId, "1".repeat(60), "u".repeat(1200));
        AuthorizationAuditService service = new AuthorizationAuditService(repository, metadata, new ObjectMapper());
        Map<String, Object> oldData = Map.of("name", "old", "passwordHash", "secret", "refreshToken", "token");
        Map<String, Object> newData = Map.of("name", "new", "status", "ACTIVE", "password", "secret");

        service.record("ROLE_UPDATED", "ROLE", UUID.randomUUID(), actorId, companyId, oldData, newData);

        ArgumentCaptor<AuthorizationAuditLog> captor = ArgumentCaptor.forClass(AuthorizationAuditLog.class);
        verify(repository).save(captor.capture());
        AuthorizationAuditLog log = captor.getValue();
        assertEquals(actorId, log.getActorUser().getId());
        assertEquals(companyId, log.getCompany().getId());
        assertEquals(Map.of("name", "old"), log.getOldData());
        assertEquals(Map.of("name", "new", "status", "ACTIVE"), log.getNewData());
        assertEquals(45, log.getIpAddress().length());
        assertEquals(1024, log.getUserAgent().length());
        assertThrows(UnsupportedOperationException.class, () -> log.getNewData().put("name", "changed"));
    }

    @Test
    void invalidatesOnlyAfterCommitAndNotAfterRollback() {
        var cache = mock(com.greenops.agent.application.security.PermissionCache.class);
        PermissionCacheInvalidator invalidator = new PermissionCacheInvalidator(cache);
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        try {
            invalidator.evictAfterCommit(userId, companyId);
            verifyNoInteractions(cache);
            for (var synchronization : org.springframework.transaction.support.TransactionSynchronizationManager.getSynchronizations()) synchronization.afterCompletion(org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK);
            verifyNoInteractions(cache);
        } finally {
            org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
        }
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        try {
            invalidator.evictAfterCommit(userId, companyId);
            for (var synchronization : org.springframework.transaction.support.TransactionSynchronizationManager.getSynchronizations()) synchronization.afterCommit();
            verify(cache).evict(userId, companyId);
        } finally {
            org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
        }
    }
}
