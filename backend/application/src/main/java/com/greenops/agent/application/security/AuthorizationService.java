package com.greenops.agent.application.security;

import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ErrorCode;
import com.greenops.agent.domain.iam.PermissionGrant;
import com.greenops.agent.domain.iam.UserCompanyRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthorizationService {
    private final UserCompanyRoleRepository repository;
    private final PermissionCache cache;

    public boolean hasPermission(UUID userId, UUID companyId, String code) {
        return repository.findEffectivePermission(userId, companyId, code, LocalDateTime.now()).isPresent();
    }

    public void requirePermission(UUID userId, UUID companyId, String code) {
        if (!hasPermission(userId, companyId, code)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Bạn không có quyền thực hiện thao tác này");
        }
    }

    public boolean isSystemRole(UUID userId, UUID companyId, String roleCode) {
        return repository.hasEffectiveSystemRole(userId, companyId, roleCode, LocalDateTime.now());
    }

    public Set<String> getEffectivePermissions(UUID userId, UUID companyId) {
        return cache.get(userId, companyId).orElseGet(() -> {
            Set<String> permissions = repository.findEffectivePermissions(userId, companyId, LocalDateTime.now()).stream()
                    .map(PermissionGrant::getCode)
                    .collect(Collectors.toUnmodifiableSet());
            cache.put(userId, companyId, permissions);
            return permissions;
        });
    }
}
