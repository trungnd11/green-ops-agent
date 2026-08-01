package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.UserRequest;
import com.greenops.agent.application.dto.UserResponse;
import com.greenops.agent.application.dto.UserRolesResponse;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.CompanyRepository;
import com.greenops.agent.domain.User;
import com.greenops.agent.domain.UserRepository;
import com.greenops.agent.domain.iam.ModuleRepository;
import com.greenops.agent.domain.iam.Permission;
import com.greenops.agent.domain.iam.PermissionRepository;
import com.greenops.agent.domain.iam.RoleRepository;
import com.greenops.agent.domain.iam.Status;
import com.greenops.agent.domain.iam.UserCompany;
import com.greenops.agent.domain.iam.UserCompanyRepository;
import com.greenops.agent.domain.iam.UserCompanyRole;
import com.greenops.agent.domain.iam.UserCompanyRoleRepository;
import com.greenops.agent.domain.iam.MembershipStatus;
import com.greenops.agent.domain.iam.PermissionGrant;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final RoleRepository roleRepository;
    private final UserCompanyRoleRepository userCompanyRoleRepository;
    private final PermissionRepository permissionRepository;
    private final ModuleRepository moduleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserCompany> getUserCompanies(UUID userId) {
        return userCompanyRepository.findEffectiveCompanies(userId, LocalDateTime.now());
    }

    public Map<String, Long> getStats(UUID companyId) {
        Map<String, Long> stats = new HashMap<>();
        for (Object[] row : userRepository.countByStatus(companyId)) {
            stats.put((String) row[0], (Long) row[1]);
        }
        return stats;
    }

    public PageResponse<UserResponse> listByCompany(UUID companyId, int page, int size, String keyword, String role, String status) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("username")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<User> userPage = userRepository.findAll(spec, PageRequest.of(page, size));
        return toPageResponse(userPage);
    }

    public UserResponse getById(UUID companyId, UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", id));
        if (!user.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Người dùng", id);
        }
        return toResponse(user);
    }

    @Transactional
    public UserResponse create(UUID companyId, UserRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Công ty", companyId));

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại");
        }

        User user = User.builder()
                .company(company)
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .status(request.getStatus() != null ? request.getStatus() : "active")
                .build();

        User savedUser = userRepository.save(user);
        log.info("Created user: {} - {}", savedUser.getUsername(), savedUser.getFullName());

        final UserCompany membership = userCompanyRepository.save(UserCompany.builder()
                .user(savedUser)
                .company(company)
                .owner(false)
                .defaultCompany(true)
                .status(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .effectiveFrom(LocalDateTime.now())
                .build());
        log.info("Created membership for user: {} in company: {}", savedUser.getUsername(), company.getCode());

        String roleCode = request.getRole() != null ? request.getRole() : "EMPLOYEE";
        roleRepository.findByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(companyId, roleCode)
                .ifPresent(role -> {
                    userCompanyRoleRepository.save(UserCompanyRole.builder()
                            .userCompany(membership)
                            .role(role)
                            .status(Status.ACTIVE)
                            .effectiveFrom(LocalDateTime.now())
                            .build());
                    log.info("Assigned role: {} to user: {}", role.getCode(), savedUser.getUsername());
                });

        return toResponse(savedUser);
    }

    @Transactional
    public UserResponse update(UUID companyId, UUID id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", id));

        if (!user.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Người dùng", id);
        }

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new BusinessException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getStatus() != null) user.setStatus(request.getStatus());

        user = userRepository.save(user);
        log.info("Updated user: {} - {}", user.getUsername(), user.getFullName());
        return toResponse(user);
    }

    @Transactional
    public void delete(UUID companyId, UUID id) {
        deactivate(companyId, id, null, null);
    }

    @Transactional(readOnly = true)
    public UserRolesResponse getUserRoles(UUID companyId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        if (!user.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Người dùng", userId);
        }

        List<UserCompanyRole> assignments = userCompanyRoleRepository.findByTenantAndUser(companyId, userId);

        List<UserRolesResponse.RoleItem> roles = assignments.stream()
                .filter(a -> a.getStatus() == Status.ACTIVE && a.getRole().getStatus() == Status.ACTIVE && a.getRole().getDeletedAt() == null)
                .map(a -> UserRolesResponse.RoleItem.builder()
                        .id(a.getRole().getId())
                        .code(a.getRole().getCode())
                        .name(a.getRole().getName())
                        .build())
                .toList();

        Set<String> effectiveCodes = userCompanyRoleRepository.findEffectivePermissions(userId, companyId, LocalDateTime.now())
                .stream().map(PermissionGrant::getCode).collect(Collectors.toSet());

        List<Permission> allPermissions = permissionRepository.findActiveTreeRows();
        Map<String, List<Permission>> byModule = new LinkedHashMap<>();
        for (Permission p : allPermissions) {
            if (effectiveCodes.contains(p.getCode())) {
                String moduleName = p.getModule().getName();
                byModule.computeIfAbsent(moduleName, k -> new ArrayList<>()).add(p);
            }
        }

        List<UserRolesResponse.PermissionGroup> groups = byModule.entrySet().stream()
                .map(e -> UserRolesResponse.PermissionGroup.builder()
                        .module(e.getKey())
                        .permissions(e.getValue().stream()
                                .map(p -> UserRolesResponse.PermissionItem.builder()
                                        .code(p.getCode())
                                        .name(p.getName())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return UserRolesResponse.builder()
                .roles(roles)
                .permissionGroups(groups)
                .build();
    }

    @Transactional
    public void deactivate(UUID companyId, UUID id, String reason, String note) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", id));

        if (!user.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Người dùng", id);
        }

        user.setStatus("inactive");
        user.setDeactivatedReason(reason);
        user.setDeactivatedNote(note);
        user.setDeactivatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Deactivated user: {} - {} (reason: {})", user.getUsername(), user.getFullName(), reason);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .companyName(user.getCompany().getName())
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .deactivatedReason(user.getDeactivatedReason())
                .deactivatedNote(user.getDeactivatedNote())
                .deactivatedAt(user.getDeactivatedAt())
                .build();
    }

    private PageResponse<UserResponse> toPageResponse(Page<User> page) {
        return PageResponse.<UserResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
