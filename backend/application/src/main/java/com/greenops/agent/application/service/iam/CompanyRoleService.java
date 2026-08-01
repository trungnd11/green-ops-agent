package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.iam.role.*;
import com.greenops.agent.application.exception.*;
import com.greenops.agent.application.security.*;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.iam.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyRoleService {
    private final RoleRepository roles;
    private final PermissionRepository permissions;
    private final RolePermissionRepository grants;
    private final UserCompanyRoleRepository assignments;
    private final CurrentCompanyProvider context;
    private final PermissionCache cache;
    private final Optional<IamAuditService> audit;

    @Transactional(readOnly = true)
    public PageResponse<RoleResponse> list(UUID companyId, Pageable pageable) {
        requireCompany(companyId);
        Page<Role> page = roles.findByCompanyIdAndDeletedAtIsNull(companyId, pageable);
        Map<UUID, List<RoleResponse.PermissionItem>> permissionItems = permissionItems(page.getContent());
        return toPageResponse(page.map(role -> response(role, permissionItems.getOrDefault(role.getId(), List.of()))));
    }

    @Transactional(readOnly = true)
    public RoleResponse get(UUID companyId, UUID roleId) {
        requireCompany(companyId);
        return response(role(companyId, roleId));
    }

    @Transactional
    public RoleResponse create(UUID companyId, CreateRoleRequest request) {
        requireCompany(companyId);
        String code = normalize(request.code());
        if (roles.existsByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(companyId, code)) throw error(ErrorCode.ROLE_CODE_ALREADY_EXISTS);
        Map<UUID, Permission> valid = validatePermissions(request.permissionIds());
        Role role = roles.save(Role.builder().company(Company.builder().id(companyId).build()).code(code).name(request.name()).description(request.description()).scope(RoleScope.COMPANY).system(false).status(Status.ACTIVE).build());
        valid.values().forEach(permission -> grants.save(RolePermission.builder().role(role).permission(permission).build()));
        changed("ROLE_CREATED", role, companyId);
        return response(role);
    }

    @Transactional
    public RoleResponse update(UUID companyId, UUID roleId, UpdateRoleRequest request) {
        requireCompany(companyId);
        Role role = role(companyId, roleId);
        mutable(role);
        role.setName(request.name());
        role.setDescription(request.description());
        role.setStatus(request.status());
        changed("ROLE_UPDATED", role, companyId);
        return response(role);
    }

    @Transactional
    public void delete(UUID companyId, UUID roleId) {
        requireCompany(companyId);
        Role role = role(companyId, roleId);
        mutable(role);
        if (assignments.existsActiveByRole(roleId, companyId)) throw error(ErrorCode.ROLE_IS_IN_USE);
        role.setStatus(Status.INACTIVE);
        role.setDeletedAt(LocalDateTime.now());
        changed("ROLE_DELETED", role, companyId);
    }

    @Transactional
    public RoleResponse replacePermissions(UUID companyId, UUID roleId, ReplaceRolePermissionsRequest request) {
        requireCompany(companyId);
        Role role = role(companyId, roleId);
        mutable(role);
        Map<UUID, Permission> desired = validatePermissions(request.permissionIds());
        Map<UUID, RolePermission> current = grants.findByRoleId(roleId).stream().collect(Collectors.toMap(grant -> grant.getPermission().getId(), Function.identity()));
        Set<UUID> removed = new HashSet<>(current.keySet());
        removed.removeAll(desired.keySet());
        if (!removed.isEmpty()) grants.deleteAllByRoleIdAndPermissionIdIn(roleId, removed);
        desired.forEach((id, permission) -> { if (!current.containsKey(id)) grants.save(RolePermission.builder().role(role).permission(permission).build()); });
        changed("ROLE_PERMISSIONS_REPLACED", role, companyId);
        return response(role);
    }

    @Transactional(readOnly = true)
    public PageResponse<RoleUserResponse> users(UUID companyId, UUID roleId, Pageable pageable) {
        requireCompany(companyId);
        role(companyId, roleId);
        Page<RoleUserResponse> page = assignments.findEffectiveUsersByRole(roleId, companyId, LocalDateTime.now(), pageable).map(assignment -> {
            var user = assignment.getUserCompany().getUser();
            return new RoleUserResponse(user.getId(), user.getUsername(), user.getFullName(), user.getEmail());
        });
        return toPageResponse(page);
    }

    private Role role(UUID companyId, UUID roleId) {
        return roles.findByIdAndCompanyIdAndDeletedAtIsNull(roleId, companyId).orElseThrow(() -> error(ErrorCode.ROLE_NOT_FOUND));
    }

    private Map<UUID, Permission> validatePermissions(Set<UUID> ids) {
        Set<UUID> requested = ids == null ? Set.of() : ids;
        Map<UUID, Permission> found = permissions.findByIdInAndDeletedAtIsNull(requested).stream().collect(Collectors.toMap(Permission::getId, Function.identity()));
        if (found.size() != requested.size() || found.values().stream().anyMatch(permission -> permission.getStatus() != Status.ACTIVE)) throw error(ErrorCode.PERMISSION_NOT_FOUND);
        return found;
    }

    private void mutable(Role role) {
        if (role.isSystem() || role.getScope() == RoleScope.SYSTEM) throw error(ErrorCode.SYSTEM_ROLE_CANNOT_BE_MODIFIED);
        if (role.getScope() != RoleScope.COMPANY || role.getCompany() == null || !context.requireCurrentCompanyId().equals(role.getCompany().getId())) throw error(ErrorCode.ROLE_NOT_BELONG_TO_COMPANY);
    }

    private void requireCompany(UUID companyId) {
        if (!companyId.equals(context.requireCurrentCompanyId())) throw error(ErrorCode.ACCESS_DENIED);
    }

    private String normalize(String code) {
        return code.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]+", "_");
    }

    private void changed(String action, Role role, UUID companyId) {
        audit.ifPresent(value -> value.record(action, "ROLE", role.getId(), null, companyId, null, Map.of("code", role.getCode(), "name", role.getName(), "status", role.getStatus().name())));
        Set<UUID> userIds = role.getId() == null ? Set.of() : assignments.findActiveUserIdsByRoleId(role.getId());
        new PermissionCacheInvalidator(cache).evictAfterCommit(userIds, companyId);
    }

    private BusinessException error(ErrorCode code) {
        return new BusinessException(code, code.name());
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .items(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private RoleResponse response(Role role) {
        List<RoleResponse.PermissionItem> items = grants.findByRoleId(role.getId()).stream().map(grant -> permissionItem(grant.getPermission())).toList();
        return response(role, items);
    }

    private RoleResponse response(Role role, List<RoleResponse.PermissionItem> items) {
        return new RoleResponse(role.getId(), role.getCompany().getId(), role.getCode(), role.getName(), role.getDescription(), role.getStatus(), role.getCreatedAt(), items);
    }

    private Map<UUID, List<RoleResponse.PermissionItem>> permissionItems(List<Role> roleList) {
        if (roleList.isEmpty()) return Map.of();
        Set<UUID> roleIds = roleList.stream().map(Role::getId).collect(Collectors.toSet());
        return grants.findByRoleIdIn(roleIds).stream().collect(Collectors.groupingBy(grant -> grant.getRole().getId(), Collectors.mapping(grant -> permissionItem(grant.getPermission()), Collectors.toList())));
    }

    private RoleResponse.PermissionItem permissionItem(Permission permission) {
        return new RoleResponse.PermissionItem(permission.getId(), permission.getCode(), permission.getName());
    }
}
