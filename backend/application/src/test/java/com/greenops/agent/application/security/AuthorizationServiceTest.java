package com.greenops.agent.application.security;

import com.greenops.agent.domain.iam.PermissionGrant;
import com.greenops.agent.domain.iam.UserCompanyRoleRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthorizationServiceTest {
    @Test
    void hasPermissionUsesDirectEffectivePermissionQuery() {
        UserCompanyRoleRepository repository = mock(UserCompanyRoleRepository.class);
        PermissionCache cache = mock(PermissionCache.class);
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        when(repository.findEffectivePermission(eq(userId), eq(companyId), eq("iam.module.list"), any())).thenReturn(Optional.of(mock(PermissionGrant.class)));
        AuthorizationService service = new AuthorizationService(repository, cache);

        assertTrue(service.hasPermission(userId, companyId, "iam.module.list"));
        verify(repository).findEffectivePermission(eq(userId), eq(companyId), eq("iam.module.list"), any());
        verifyNoInteractions(cache);
    }
}
