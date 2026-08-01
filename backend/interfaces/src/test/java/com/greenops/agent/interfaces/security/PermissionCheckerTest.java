package com.greenops.agent.interfaces.security;

import com.greenops.agent.application.security.AuthorizationService;
import com.greenops.agent.application.security.CurrentCompanyProvider;
import com.greenops.agent.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PermissionCheckerTest {
    @Test
    void spelCompatibleSignatureUsesCurrentAuthentication() {
        AuthorizationService authorization = mock(AuthorizationService.class);
        CurrentCompanyProvider company = mock(CurrentCompanyProvider.class);
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        when(company.getCurrentCompanyId()).thenReturn(Optional.of(companyId));
        when(authorization.hasPermission(userId, companyId, "iam.module.list")).thenReturn(true);
        PermissionChecker checker = new PermissionChecker(authorization, company);

        assertTrue(checker.hasPermission(new UsernamePasswordAuthenticationToken(user, null), "iam.module.list"));
        assertTrue(checker.hasPermission("iam.module.list", new UsernamePasswordAuthenticationToken(user, null)));
    }
}
