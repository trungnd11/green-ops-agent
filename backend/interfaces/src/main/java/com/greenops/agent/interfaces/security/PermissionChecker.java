package com.greenops.agent.interfaces.security;

import com.greenops.agent.application.security.AuthorizationService;
import com.greenops.agent.application.security.CurrentCompanyProvider;
import com.greenops.agent.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("permissionChecker")
@RequiredArgsConstructor
public class PermissionChecker {
    private final AuthorizationService authorizationService;
    private final CurrentCompanyProvider currentCompanyProvider;

    public boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) return false;
        return currentCompanyProvider.getCurrentCompanyId()
                .map(companyId -> authorizationService.isSystemRole(user.getId(), companyId, "SUPER_ADMIN"))
                .orElse(false);
    }

    public boolean hasPermission(String code) {
        return hasPermission(SecurityContextHolder.getContext().getAuthentication(), code);
    }

    public boolean hasPermission(String code, Authentication authentication) {
        return hasPermission(authentication, code);
    }

    public boolean hasPermission(Authentication authentication, String code) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return false;
        }
        return currentCompanyProvider.getCurrentCompanyId()
                .map(companyId -> authorizationService.hasPermission(user.getId(), companyId, code))
                .orElse(false);
    }
}
