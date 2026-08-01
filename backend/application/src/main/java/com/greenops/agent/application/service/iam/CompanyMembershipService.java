package com.greenops.agent.application.service.iam;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.iam.membership.*;
import com.greenops.agent.application.exception.*;
import com.greenops.agent.application.security.*;
import com.greenops.agent.domain.*;
import com.greenops.agent.domain.iam.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyMembershipService {
    private final UserCompanyRepository memberships;
    private final UserCompanyRoleRepository assignments;
    private final RoleRepository roles;
    private final UserRepository users;
    private final CompanyRepository companies;
    private final CurrentCompanyProvider companyContext;
    private final PermissionCache cache;
    private final Optional<IamAuditService> audit;

    @Transactional(readOnly = true)
    public PageResponse<MembershipResponse> list(UUID companyId, String keyword, MembershipStatus status, UUID roleId, Pageable pageable) {
        requireCompany(companyId);
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        Page<MembershipResponse> page = memberships.findMemberships(companyId, normalizedKeyword, status, roleId, pageable).map(this::response);
        return toPageResponse(page);
    }

    @Transactional
    public MembershipResponse create(UUID companyId, CreateMembershipRequest request) {
        requireCompany(companyId);
        validateTime(request.effectiveFrom(), request.effectiveTo());
        User user = users.findById(request.userId()).orElseThrow(() -> error(ErrorCode.USER_NOT_FOUND));
        if (!"active".equalsIgnoreCase(user.getStatus())) throw error(ErrorCode.USER_INACTIVE);
        if (memberships.existsByUserIdAndCompanyIdAndDeletedAtIsNull(user.getId(), companyId)) throw error(ErrorCode.USER_ALREADY_IN_COMPANY);
        Company company = companies.findById(companyId).orElseThrow(() -> error(ErrorCode.COMPANY_NOT_FOUND));
        Map<UUID, Role> validRoles = validateRoles(companyId, request.roleIds());
        UserCompany membership = memberships.save(UserCompany.builder().user(user).company(company).employeeCode(request.employeeCode()).jobTitle(request.jobTitle()).status(request.status() == null ? MembershipStatus.ACTIVE : request.status()).joinedAt(LocalDateTime.now()).effectiveFrom(request.effectiveFrom()).effectiveTo(request.effectiveTo()).build());
        if (isCurrentActive(membership)) validRoles.values().forEach(role -> assignments.save(UserCompanyRole.builder().userCompany(membership).role(role).effectiveFrom(request.effectiveFrom()).effectiveTo(request.effectiveTo()).build()));
        changed("MEMBERSHIP_CREATED", membership, user.getId(), companyId, null, snapshot(membership, validRoles.keySet(), Set.of(), validRoles.keySet()));
        return response(membership);
    }

    @Transactional
    public MembershipResponse update(UUID companyId, UUID userId, UpdateMembershipRequest request) {
        requireCompany(companyId);
        validateTime(request.effectiveFrom(), request.effectiveTo());
        UserCompany membership = membership(companyId, userId);
        if (request.status() == MembershipStatus.REMOVED) throw error(ErrorCode.INVALID_ARGUMENT);
        List<UserCompanyRole> rows = assignments.findByUserCompanyId(membership.getId());
        Map<String, Object> before = snapshot(membership, activeRoleIds(rows), Set.of(), Set.of());
        membership.setEmployeeCode(request.employeeCode()); membership.setJobTitle(request.jobTitle()); membership.setStatus(request.status()); membership.setEffectiveFrom(request.effectiveFrom()); membership.setEffectiveTo(request.effectiveTo());
        if (!isCurrentActive(membership)) rows.stream().filter(a -> a.getStatus() == Status.ACTIVE).forEach(a -> a.setStatus(Status.INACTIVE));
        changed("MEMBERSHIP_UPDATED", membership, userId, companyId, before, snapshot(membership, activeRoleIds(rows), Set.of(), Set.of()));
        return response(membership);
    }

    @Transactional
    public void remove(UUID companyId, UUID userId) {
        requireCompany(companyId);
        UserCompany membership = membership(companyId, userId);
        List<UserCompanyRole> rows = assignments.findByUserCompanyId(membership.getId());
        Set<UUID> removedRoleIds = activeRoleIds(rows);
        Map<String, Object> before = snapshot(membership, removedRoleIds, Set.of(), Set.of());
        membership.setStatus(MembershipStatus.REMOVED);
        rows.stream().filter(a -> a.getStatus() == Status.ACTIVE).forEach(a -> a.setStatus(Status.INACTIVE));
        changed("MEMBERSHIP_REMOVED", membership, userId, companyId, before, snapshot(membership, Set.of(), Set.of(), removedRoleIds));
    }

    @Transactional
    public MembershipResponse replaceRoles(UUID companyId, UUID userId, ReplaceMembershipRolesRequest request) {
        requireCompany(companyId);
        UserCompany membership = membership(companyId, userId);
        if (!isCurrentActive(membership)) throw error(ErrorCode.USER_COMPANY_INACTIVE);
        Map<UUID, Role> desired = validateRoles(companyId, request.roleIds());
        Map<UUID, UserCompanyRole> current = assignments.findByUserCompanyId(membership.getId()).stream().collect(Collectors.toMap(a -> a.getRole().getId(), Function.identity()));
        Set<UUID> beforeIds = activeRoleIds(current.values());
        Set<UUID> removed = new HashSet<>(beforeIds); removed.removeAll(desired.keySet());
        Set<UUID> added = new HashSet<>(desired.keySet()); added.removeAll(beforeIds);
        current.forEach((id, assignment) -> { if (!desired.containsKey(id) && assignment.getStatus() == Status.ACTIVE) assignment.setStatus(Status.INACTIVE); });
        desired.forEach((id, role) -> { UserCompanyRole assignment = current.get(id); if (assignment == null) assignments.save(UserCompanyRole.builder().userCompany(membership).role(role).build()); else if (assignment.getStatus() != Status.ACTIVE) assignment.setStatus(Status.ACTIVE); });
        changed("MEMBERSHIP_ROLES_REPLACED", membership, userId, companyId, snapshot(membership, beforeIds, Set.of(), Set.of()), snapshot(membership, desired.keySet(), added, removed));
        return response(membership);
    }

    private Map<UUID, Role> validateRoles(UUID companyId, Set<UUID> ids) {
        Set<UUID> requested = ids == null ? Set.of() : ids;
        Map<UUID, Role> result = roles.findAllById(requested).stream().collect(Collectors.toMap(Role::getId, Function.identity()));
        if (result.size() != requested.size()) throw error(ErrorCode.ROLE_NOT_FOUND);
        result.values().forEach(role -> { if (role.isSystem() || role.getScope() == RoleScope.SYSTEM) throw error(ErrorCode.SYSTEM_ROLE_CANNOT_BE_MODIFIED); if (role.getScope() != RoleScope.COMPANY || role.getCompany() == null || !companyId.equals(role.getCompany().getId())) throw error(ErrorCode.ROLE_NOT_BELONG_TO_COMPANY); if (role.getStatus() != Status.ACTIVE || role.getDeletedAt() != null) throw error(ErrorCode.ROLE_NOT_FOUND); });
        return result;
    }

    private UserCompany membership(UUID companyId, UUID userId) { return memberships.findByUserIdAndCompanyIdAndDeletedAtIsNull(userId, companyId).orElseThrow(() -> error(ErrorCode.USER_NOT_IN_COMPANY)); }
    private void requireCompany(UUID companyId) { if (!companyId.equals(companyContext.requireCurrentCompanyId())) throw error(ErrorCode.ACCESS_DENIED); }
    private void validateTime(LocalDateTime from, LocalDateTime to) { if (from != null && to != null && !to.isAfter(from)) throw error(ErrorCode.INVALID_EFFECTIVE_TIME); }
    private boolean isCurrentActive(UserCompany membership) { LocalDateTime now = LocalDateTime.now(); return membership.getStatus() == MembershipStatus.ACTIVE && (membership.getEffectiveFrom() == null || !membership.getEffectiveFrom().isAfter(now)) && (membership.getEffectiveTo() == null || membership.getEffectiveTo().isAfter(now)); }
    private Set<UUID> activeRoleIds(Collection<UserCompanyRole> rows) { return rows.stream().filter(a -> a.getStatus() == Status.ACTIVE).map(a -> a.getRole().getId()).collect(Collectors.toUnmodifiableSet()); }
    private Map<String, Object> snapshot(UserCompany membership, Set<UUID> roleIds, Set<UUID> added, Set<UUID> removed) { Map<String, Object> data = new LinkedHashMap<>(); data.put("userId", membership.getUser().getId()); data.put("companyId", membership.getCompany() == null ? null : membership.getCompany().getId()); data.put("status", membership.getStatus().name()); data.put("employeeCode", membership.getEmployeeCode()); data.put("jobTitle", membership.getJobTitle()); data.put("effectiveFrom", membership.getEffectiveFrom()); data.put("effectiveTo", membership.getEffectiveTo()); data.put("roleIds", Set.copyOf(roleIds)); data.put("addedRoleIds", Set.copyOf(added)); data.put("removedRoleIds", Set.copyOf(removed)); return Collections.unmodifiableMap(data); }
    private void changed(String action, UserCompany membership, UUID userId, UUID companyId, Object before, Object after) {
        audit.ifPresent(a -> a.record(action, "USER_COMPANY", membership.getId(), null, companyId, before, after));
        new PermissionCacheInvalidator(cache).evictAfterCommit(userId, companyId);
    }
    private BusinessException error(ErrorCode code) { return new BusinessException(code, code.name()); }
    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder().items(page.getContent()).page(page.getNumber()).size(page.getSize()).totalElements(page.getTotalElements()).totalPages(page.getTotalPages()).first(page.isFirst()).last(page.isLast()).build();
    }
    private MembershipResponse response(UserCompany m) { List<MembershipResponse.RoleItem> roleItems = assignments.findByUserCompanyId(m.getId()).stream().filter(a -> a.getStatus() == Status.ACTIVE).map(a -> new MembershipResponse.RoleItem(a.getRole().getId(), a.getRole().getCode(), a.getRole().getName())).toList(); User u = m.getUser(); return new MembershipResponse(m.getId(), u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), m.getEmployeeCode(), m.getJobTitle(), m.getStatus(), m.getEffectiveFrom(), m.getEffectiveTo(), roleItems); }
}
