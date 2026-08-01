package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.iam.catalog.ModuleTreeResponse;
import com.greenops.agent.application.dto.iam.me.*;
import com.greenops.agent.application.security.AuthorizationService;
import com.greenops.agent.domain.iam.Module;
import com.greenops.agent.domain.iam.ModuleRepository;
import com.greenops.agent.domain.iam.PermissionRepository;
import com.greenops.agent.domain.iam.UserCompanyRepository;
import com.greenops.agent.domain.iam.UserCompanyRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CurrentUserIamService {
    private final UserCompanyRoleRepository assignments;
    private final UserCompanyRepository memberships;
    private final AuthorizationService authorization;
    private final ModuleRepository modules;
    private final PermissionRepository permissions;

    @Transactional(readOnly = true)
    public List<CurrentCompanyResponse> companies(UUID userId) { return memberships.findEffectiveCompanies(userId, LocalDateTime.now()).stream().map(value -> new CurrentCompanyResponse(value.getCompany().getId(), value.getCompany().getCode(), value.getCompany().getName(), value.isDefaultCompany())).toList(); }
    @Transactional(readOnly = true)
    public CurrentPermissionsResponse permissions(UUID userId, UUID companyId) { return new CurrentPermissionsResponse(assignments.findEffectiveRoleCodes(userId, companyId, LocalDateTime.now()).stream().distinct().sorted().toList(), authorization.getEffectivePermissions(userId, companyId).stream().sorted().toList()); }
    @Transactional(readOnly = true)
    public List<ModuleTreeResponse> menu(UUID userId, UUID companyId) {
        Set<String> allowed = authorization.getEffectivePermissions(userId, companyId);
        Set<UUID> permittedModules = permissions.findActiveTreeRows().stream().filter(value -> allowed.contains(value.getCode())).map(value -> value.getModule().getId()).collect(java.util.stream.Collectors.toSet());
        List<Module> rows = modules.findActiveTreeRows();
        Map<UUID, Module> byId = rows.stream().collect(java.util.stream.Collectors.toMap(Module::getId, value -> value));
        Set<UUID> included = new HashSet<>(permittedModules);
        for (UUID id : new HashSet<>(included)) { Module value = byId.get(id); while (value != null && value.getParent() != null) { value = byId.get(value.getParent().getId()); if (value != null) included.add(value.getId()); } }
        Map<UUID, List<Module>> children = new HashMap<>(); rows.stream().filter(value -> included.contains(value.getId())).forEach(value -> children.computeIfAbsent(value.getParent() == null ? null : value.getParent().getId(), key -> new ArrayList<>()).add(value));
        return children.getOrDefault(null, List.of()).stream().map(value -> map(value, children)).toList();
    }
    private ModuleTreeResponse map(Module value, Map<UUID, List<Module>> children) { return new ModuleTreeResponse(value.getId(), value.getCode(), value.getName(), value.getDescription(), value.getParent() == null ? null : value.getParent().getId(), value.getModuleType(), value.getRoute(), value.getIcon(), value.getDisplayOrder(), value.getStatus(), children.getOrDefault(value.getId(), List.of()).stream().map(child -> map(child, children)).toList()); }
}
