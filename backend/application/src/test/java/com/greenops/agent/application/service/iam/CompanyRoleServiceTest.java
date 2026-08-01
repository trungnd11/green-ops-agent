package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.iam.role.*;
import com.greenops.agent.application.exception.*;
import com.greenops.agent.application.security.*;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.iam.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyRoleServiceTest {
    @Mock RoleRepository roles;
    @Mock PermissionRepository permissions;
    @Mock RolePermissionRepository grants;
    @Mock UserCompanyRoleRepository assignments;
    @Mock CurrentCompanyProvider context;
    @Mock PermissionCache cache;
    @Mock IamAuditService audit;
    CompanyRoleService service;
    UUID companyId;

    @BeforeEach void setUp() {
        companyId = UUID.randomUUID();
        service = new CompanyRoleService(roles, permissions, grants, assignments, context, cache, Optional.of(audit));
        lenient().when(context.requireCurrentCompanyId()).thenReturn(companyId);
    }

    @Test void createForcesTenantDefaultsAndInitialActivePermissions() {
        UUID permissionId = UUID.randomUUID();
        Permission permission = permission(permissionId, Status.ACTIVE);
        when(permissions.findByIdInAndDeletedAtIsNull(Set.of(permissionId))).thenReturn(List.of(permission));
        when(roles.save(any())).thenAnswer(i -> { Role role = i.getArgument(0); role.setId(UUID.randomUUID()); return role; });
        when(grants.findByRoleId(any())).thenReturn(List.of());
        RoleResponse response = service.create(companyId, new CreateRoleRequest(" dispatcher ", "Dispatcher", null, Set.of(permissionId)));
        verify(roles).save(argThat(r -> r.getScope() == RoleScope.COMPANY && !r.isSystem() && r.getStatus() == Status.ACTIVE && companyId.equals(r.getCompany().getId()) && "DISPATCHER".equals(r.getCode())));
        verify(grants).save(argThat(g -> permissionId.equals(g.getPermission().getId())));
        assertEquals(companyId, response.companyId());
    }

    @Test void duplicateCodeIsScopedToCurrentCompany() {
        when(roles.existsByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(companyId, "OPS")).thenReturn(true);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.create(companyId, new CreateRoleRequest("ops", "Ops", null, Set.of())));
        assertEquals(ErrorCode.ROLE_CODE_ALREADY_EXISTS, ex.getCode());
        verify(roles, never()).save(any());
    }

    @Test void rejectsPathCompanyDifferentFromContextBeforeLookup() {
        assertThrows(BusinessException.class, () -> service.get(UUID.randomUUID(), UUID.randomUUID()));
        verifyNoInteractions(roles);
    }

    @Test void validatesAllPermissionsBeforeMutation() {
        UUID activeId = UUID.randomUUID(); UUID inactiveId = UUID.randomUUID();
        when(permissions.findByIdInAndDeletedAtIsNull(Set.of(activeId, inactiveId))).thenReturn(List.of(permission(activeId, Status.ACTIVE), permission(inactiveId, Status.INACTIVE)));
        assertThrows(BusinessException.class, () -> service.create(companyId, new CreateRoleRequest("ops", "Ops", null, Set.of(activeId, inactiveId))));
        verify(roles, never()).save(any()); verify(grants, never()).save(any());
    }

    @Test void systemRoleCannotBeChangedOrDeleted() {
        UUID roleId = UUID.randomUUID(); Role role = role(roleId); role.setSystem(true);
        when(roles.findByIdAndCompanyIdAndDeletedAtIsNull(roleId, companyId)).thenReturn(Optional.of(role));
        assertThrows(BusinessException.class, () -> service.update(companyId, roleId, new UpdateRoleRequest("Changed", null, Status.ACTIVE)));
        assertThrows(BusinessException.class, () -> service.delete(companyId, roleId));
    }

    @Test void deleteInUseRoleReturnsConflictWithoutSoftDelete() {
        UUID roleId = UUID.randomUUID(); Role role = role(roleId);
        when(roles.findByIdAndCompanyIdAndDeletedAtIsNull(roleId, companyId)).thenReturn(Optional.of(role));
        when(assignments.existsActiveByRole(roleId, companyId)).thenReturn(true);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.delete(companyId, roleId));
        assertEquals(ErrorCode.ROLE_IS_IN_USE, ex.getCode()); assertNull(role.getDeletedAt());
    }

    @Test void replacePermissionsMutatesOnlyDeltaAndPreservesUnchangedGrant() {
        UUID roleId = UUID.randomUUID(), keptId = UUID.randomUUID(), removedId = UUID.randomUUID(), addedId = UUID.randomUUID();
        Role role = role(roleId); Permission kept = permission(keptId, Status.ACTIVE), removed = permission(removedId, Status.ACTIVE), added = permission(addedId, Status.ACTIVE);
        RolePermission keptGrant = RolePermission.builder().role(role).permission(kept).build();
        when(roles.findByIdAndCompanyIdAndDeletedAtIsNull(roleId, companyId)).thenReturn(Optional.of(role));
        when(permissions.findByIdInAndDeletedAtIsNull(Set.of(keptId, addedId))).thenReturn(List.of(kept, added));
        when(grants.findByRoleId(roleId)).thenReturn(List.of(keptGrant, RolePermission.builder().role(role).permission(removed).build()), List.of(keptGrant, RolePermission.builder().role(role).permission(added).build()));
        service.replacePermissions(companyId, roleId, new ReplaceRolePermissionsRequest(Set.of(keptId, addedId)));
        verify(grants).deleteAllByRoleIdAndPermissionIdIn(roleId, Set.of(removedId));
        verify(grants, times(1)).save(argThat(g -> addedId.equals(g.getPermission().getId())));
        verify(audit).record(eq("ROLE_PERMISSIONS_REPLACED"), eq("ROLE"), eq(roleId), isNull(), eq(companyId), isNull(), argThat(value -> value instanceof Map<?, ?> data && data.get("code").equals("OPS")));
    }

    private Role role(UUID id) { return Role.builder().id(id).company(Company.builder().id(companyId).build()).code("OPS").name("Ops").scope(RoleScope.COMPANY).status(Status.ACTIVE).build(); }
    private Permission permission(UUID id, Status status) { return Permission.builder().id(id).code(id.toString()).name("Permission").resource("r").action("a").permissionType(PermissionType.API).status(status).build(); }
}
