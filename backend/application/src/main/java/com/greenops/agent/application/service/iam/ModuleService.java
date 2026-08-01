package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.iam.catalog.*;
import com.greenops.agent.application.exception.*;
import com.greenops.agent.domain.iam.Module;
import com.greenops.agent.domain.iam.ModuleRepository;
import com.greenops.agent.domain.iam.PermissionRepository;
import com.greenops.agent.domain.iam.Status;
import com.greenops.agent.domain.iam.UserCompanyRoleRepository;
import com.greenops.agent.application.security.PermissionCache;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ModuleService {
    private final ModuleRepository modules;
    private final PermissionRepository permissions;
    private final UserCompanyRoleRepository assignments;
    private final PermissionCache cache;
    private final Optional<IamAuditService> audit;

    @Transactional(readOnly = true)
    public List<ModuleTreeResponse> tree() {
        List<Module> rows = modules.findActiveTreeRows();
        Map<UUID, List<Module>> children = new HashMap<>();
        rows.forEach(row -> children.computeIfAbsent(row.getParent() == null ? null : row.getParent().getId(), key -> new ArrayList<>()).add(row));
        return children.getOrDefault(null, List.of()).stream().map(row -> map(row, children)).toList();
    }

    @Transactional
    public ModuleTreeResponse create(ModuleRequest request) {
        validateCode(request.code(), null);
        Module parent = parent(request.parentId(), null);
        Module module = modules.save(Module.builder().code(normalize(request.code())).name(request.name()).description(request.description()).parent(parent).moduleType(request.moduleType()).route(request.route()).icon(request.icon()).displayOrder(order(request.displayOrder())).status(status(request.status())).build());
        audit("MODULE_CREATED", module, null);
        return map(module, Map.of());
    }

    @Transactional
    public ModuleTreeResponse update(UUID id, ModuleRequest request) {
        Module module = find(id);
        Map<String, Object> oldData = snapshot(module);
        validateCode(request.code(), id);
        Module parent = parent(request.parentId(), id);
        module.setCode(normalize(request.code())); module.setName(request.name()); module.setDescription(request.description()); module.setParent(parent); module.setModuleType(request.moduleType()); module.setRoute(request.route()); module.setIcon(request.icon()); module.setDisplayOrder(order(request.displayOrder())); module.setStatus(status(request.status()));
        changed("MODULE_UPDATED", module, oldData);
        return map(module, Map.of());
    }

    @Transactional
    public void delete(UUID id) {
        Module module = find(id);
        if (modules.existsByParentIdAndDeletedAtIsNull(id) || permissions.existsByModuleIdAndDeletedAtIsNull(id)) throw error(ErrorCode.RESOURCE_IN_USE);
        Map<String, Object> oldData = snapshot(module);
        module.setStatus(Status.INACTIVE); module.setDeletedAt(LocalDateTime.now());
        changed("MODULE_DELETED", module, oldData);
    }

    private Module find(UUID id) { return modules.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> error(ErrorCode.MODULE_NOT_FOUND)); }
    private Module parent(UUID id, UUID self) { if (id == null) return null; if (id.equals(self)) throw error(ErrorCode.INVALID_ARGUMENT); return modules.findByIdAndDeletedAtIsNull(id).filter(value -> value.getStatus() == Status.ACTIVE).orElseThrow(() -> error(ErrorCode.MODULE_NOT_FOUND)); }
    private void validateCode(String code, UUID self) { modules.findByCodeIgnoreCaseAndDeletedAtIsNull(normalize(code)).filter(value -> !value.getId().equals(self)).ifPresent(value -> { throw error(ErrorCode.MODULE_CODE_ALREADY_EXISTS); }); }
    private ModuleTreeResponse map(Module module, Map<UUID, List<Module>> children) { return new ModuleTreeResponse(module.getId(), module.getCode(), module.getName(), module.getDescription(), module.getParent() == null ? null : module.getParent().getId(), module.getModuleType(), module.getRoute(), module.getIcon(), module.getDisplayOrder(), module.getStatus(), children.getOrDefault(module.getId(), List.of()).stream().map(child -> map(child, children)).toList()); }
    private Map<String, Object> snapshot(Module module) { Map<String, Object> data = new LinkedHashMap<>(); data.put("code", module.getCode()); data.put("name", module.getName()); data.put("description", module.getDescription()); data.put("parentId", module.getParent() == null ? null : module.getParent().getId()); data.put("route", module.getRoute()); data.put("icon", module.getIcon()); data.put("displayOrder", module.getDisplayOrder()); data.put("status", module.getStatus().name()); return Collections.unmodifiableMap(data); }
    private void audit(String action, Module module, Map<String, Object> oldData) { audit.ifPresent(value -> value.record(action, "MODULE", module.getId(), null, null, oldData, snapshot(module))); }
    private void changed(String action, Module module, Map<String, Object> oldData) { audit(action, module, oldData); assignments.findActiveUserCompanyIdsByModuleId(module.getId()).forEach(row -> new com.greenops.agent.application.service.iam.PermissionCacheInvalidator(cache).evictAfterCommit((UUID) row[0], (UUID) row[1])); }
    private String normalize(String code) { return code.trim().toUpperCase(Locale.ROOT); }
    private int order(Integer value) { return value == null ? 0 : value; }
    private Status status(Status value) { return value == null ? Status.ACTIVE : value; }
    private BusinessException error(ErrorCode code) { return new BusinessException(code, code.name()); }
}
