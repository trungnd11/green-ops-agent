package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.iam.membership.ReplaceMembershipRolesRequest;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.security.CurrentCompanyProvider;
import com.greenops.agent.application.security.PermissionCache;
import com.greenops.agent.domain.CompanyRepository;
import com.greenops.agent.domain.User;
import com.greenops.agent.domain.UserRepository;
import com.greenops.agent.domain.iam.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyMembershipServiceTest {
    @Mock UserCompanyRepository memberships;
    @Mock UserCompanyRoleRepository assignments;
    @Mock RoleRepository roles;
    @Mock UserRepository users;
    @Mock CompanyRepository companies;
    @Mock CurrentCompanyProvider context;
    @Mock PermissionCache cache;
    @Mock IamAuditService audit;

    CompanyMembershipService service;

    @BeforeEach
    void setUp() {
        service = new CompanyMembershipService(memberships, assignments, roles, users, companies, context, cache, Optional.of(audit));
    }

    @Test
    void rejectsPathCompanyDifferentFromCurrentCompany() {
        UUID pathCompany = UUID.randomUUID();
        when(context.requireCurrentCompanyId()).thenReturn(UUID.randomUUID());
        assertThrows(BusinessException.class, () -> service.remove(pathCompany, UUID.randomUUID()));
        verifyNoInteractions(memberships, assignments);
    }

    @Test
    void replacingRolesMutatesOnlyDeltaAndEvictsAfterCommit() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID keptId = UUID.randomUUID();
        UUID removedId = UUID.randomUUID();
        UUID addedId = UUID.randomUUID();
        User user = User.builder().id(userId).status("active").build();
        UserCompany membership = UserCompany.builder().id(UUID.randomUUID()).user(user).status(MembershipStatus.ACTIVE).build();
        Role kept = companyRole(keptId, companyId);
        Role removed = companyRole(removedId, companyId);
        Role added = companyRole(addedId, companyId);
        UserCompanyRole keptAssignment = UserCompanyRole.builder().userCompany(membership).role(kept).status(Status.ACTIVE).build();
        UserCompanyRole removedAssignment = UserCompanyRole.builder().userCompany(membership).role(removed).status(Status.ACTIVE).build();
        when(context.requireCurrentCompanyId()).thenReturn(companyId);
        when(memberships.findByUserIdAndCompanyIdAndDeletedAtIsNull(userId, companyId)).thenReturn(Optional.of(membership));
        when(roles.findAllById(Set.of(keptId, addedId))).thenReturn(List.of(kept, added));
        when(assignments.findByUserCompanyId(membership.getId())).thenReturn(List.of(keptAssignment, removedAssignment));
        when(assignments.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.replaceRoles(companyId, userId, new ReplaceMembershipRolesRequest(Set.of(keptId, addedId)));
            assertEquals(Status.ACTIVE, keptAssignment.getStatus());
            assertEquals(Status.INACTIVE, removedAssignment.getStatus());
            verify(assignments, times(1)).save(argThat(a -> a.getRole().getId().equals(addedId)));
            verify(cache, never()).evict(userId, companyId);
            for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) synchronization.afterCommit();
            verify(cache).evict(userId, companyId);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    private Role companyRole(UUID roleId, UUID companyId) {
        return Role.builder().id(roleId).company(com.greenops.agent.domain.Company.builder().id(companyId).build()).scope(RoleScope.COMPANY).status(Status.ACTIVE).build();
    }
}
