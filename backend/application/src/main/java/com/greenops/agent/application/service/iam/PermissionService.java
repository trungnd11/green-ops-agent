package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.iam.catalog.*;
import com.greenops.agent.application.exception.*;
import com.greenops.agent.domain.iam.Module;
import com.greenops.agent.domain.iam.ModuleRepository;
import com.greenops.agent.domain.iam.Permission;
import com.greenops.agent.domain.iam.PermissionRepository;
import com.greenops.agent.domain.iam.RolePermissionRepository;
import com.greenops.agent.domain.iam.Status;
import com.greenops.agent.domain.iam.UserCompanyRoleRepository;
import com.greenops.agent.application.security.PermissionCache;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PermissionService {
    private final PermissionRepository permissions;
    private final ModuleRepository modules;
    private final RolePermissionRepository grants;
    private final UserCompanyRoleRepository assignments;
    private final PermissionCache cache;
    private final Optional<IamAuditService> audit;

    @Transactional(readOnly = true)
    public PageResponse<PermissionResponse> list(Pageable pageable) {
        Page<PermissionResponse> page = permissions.findByDeletedAtIsNull(pageable).map(this::map);
        return PageResponse.<PermissionResponse>builder().items(page.getContent()).page(page.getNumber()).size(page.getSize()).totalElements(page.getTotalElements()).totalPages(page.getTotalPages()).first(page.isFirst()).last(page.isLast()).build();
    }

    @Transactional(readOnly = true)
    public List<PermissionTreeResponse> tree() {
        List<Module> moduleRows = modules.findActiveTreeRows();
        List<Permission> permissionRows = permissions.findActiveTreeRows();
        Map<UUID, List<Module>> children = new HashMap<>();
        moduleRows.forEach(row -> children.computeIfAbsent(row.getParent() == null ? null : row.getParent().getId(), key -> new ArrayList<>()).add(row));
        Map<UUID, List<Permission>> byModule = new HashMap<>();
        permissionRows.forEach(row -> byModule.computeIfAbsent(row.getModule().getId(), key -> new ArrayList<>()).add(row));
        return children.getOrDefault(null, List.of()).stream().map(row -> tree(row, children, byModule)).toList();
    }

    @Transactional public PermissionResponse create(PermissionRequest request) { validate(request, null); Permission permission = permissions.save(build(request)); audit("PERMISSION_CREATED", permission, null); return map(permission); }
    @Transactional public PermissionResponse update(UUID id, PermissionRequest request) { Permission permission = find(id); Map<String, Object> before = snapshot(permission); validate(request, id); permission.setModule(module(request.moduleId())); permission.setCode(normalize(request.code())); permission.setName(request.name()); permission.setDescription(request.description()); permission.setResource(request.resource()); permission.setAction(request.action()); permission.setPermissionType(request.permissionType()); permission.setStatus(request.status() == null ? Status.ACTIVE : request.status()); changed("PERMISSION_UPDATED", permission, before); return map(permission); }
    @Transactional public void delete(UUID id) { Permission permission = find(id); if (grants.existsByPermissionId(id)) throw error(ErrorCode.RESOURCE_IN_USE); Map<String, Object> before = snapshot(permission); permission.setStatus(Status.INACTIVE); permission.setDeletedAt(LocalDateTime.now()); changed("PERMISSION_DELETED", permission, before); }

    private void validate(PermissionRequest request, UUID self) {
        permissions.findByCodeIgnoreCaseAndDeletedAtIsNull(normalize(request.code())).filter(value -> !value.getId().equals(self)).ifPresent(value -> { throw error(ErrorCode.PERMISSION_CODE_ALREADY_EXISTS); });
        boolean duplicate = permissions.findByModuleIdAndStatusAndDeletedAtIsNull(request.moduleId(), Status.ACTIVE).stream().anyMatch(value -> value.getResource().equalsIgnoreCase(request.resource()) && value.getAction().equalsIgnoreCase(request.action()) && !value.getId().equals(self));
        if (duplicate) throw error(ErrorCode.PERMISSION_SIGNATURE_ALREADY_EXISTS);
        module(request.moduleId());
    }
    private Permission build(PermissionRequest request) { return Permission.builder().module(module(request.moduleId())).code(normalize(request.code())).name(request.name()).description(request.description()).resource(request.resource()).action(request.action()).permissionType(request.permissionType()).status(request.status() == null ? Status.ACTIVE : request.status()).build(); }
    private Permission find(UUID id) { return permissions.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> error(ErrorCode.PERMISSION_NOT_FOUND)); }
    private Module module(UUID id) { return modules.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> error(ErrorCode.MODULE_NOT_FOUND)); }
    private PermissionResponse map(Permission value) { return new PermissionResponse(value.getId(), value.getModule().getId(), value.getModule().getCode(), value.getCode(), value.getName(), value.getDescription(), value.getResource(), value.getAction(), value.getPermissionType(), value.getStatus()); }
    private PermissionTreeResponse tree(Module module, Map<UUID, List<Module>> children, Map<UUID, List<Permission>> values) { return new PermissionTreeResponse(module.getId(), module.getCode(), module.getName(), values.getOrDefault(module.getId(), List.of()).stream().map(this::map).toList(), children.getOrDefault(module.getId(), List.of()).stream().map(child -> tree(child, children, values)).toList()); }
    private Map<String, Object> snapshot(Permission value) { Map<String, Object> data = new LinkedHashMap<>(); data.put("moduleId", value.getModule().getId()); data.put("code", value.getCode()); data.put("name", value.getName()); data.put("resource", value.getResource()); data.put("action", value.getAction()); data.put("status", value.getStatus().name()); return Collections.unmodifiableMap(data); }
    private void audit(String action, Permission permission, Object before) { audit.ifPresent(value -> value.record(action, "PERMISSION", permission.getId(), null, null, before, snapshot(permission))); }
    private void changed(String action, Permission permission, Object before) { audit(action, permission, before); assignments.findActiveUserCompanyIdsByPermissionId(permission.getId()).forEach(row -> new PermissionCacheInvalidator(cache).evictAfterCommit((UUID) row[0], (UUID) row[1])); }
    private String normalize(String code) { return code.trim().toLowerCase(Locale.ROOT); }
    private BusinessException error(ErrorCode code) { return new BusinessException(code, code.name()); }
}
