package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.iam.role.*;
import com.greenops.agent.application.service.iam.CompanyRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/companies/{companyId}/roles")
@RequiredArgsConstructor
public class CompanyRoleController {
    private final CompanyRoleService service;
    @GetMapping @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_ROLE_LIST)") public ApiResponse<PageResponse<RoleResponse>> list(@PathVariable UUID companyId, Pageable pageable) { return ApiResponse.ok(service.list(companyId, pageable)); }
    @GetMapping("/{roleId}") @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_ROLE_VIEW)") public ApiResponse<RoleResponse> get(@PathVariable UUID companyId, @PathVariable UUID roleId) { return ApiResponse.ok(service.get(companyId, roleId)); }
    @PostMapping @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_ROLE_CREATE)") public ApiResponse<RoleResponse> create(@PathVariable UUID companyId, @Valid @RequestBody CreateRoleRequest request) { return ApiResponse.ok(service.create(companyId, request)); }
    @PutMapping("/{roleId}") @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_ROLE_UPDATE)") public ApiResponse<RoleResponse> update(@PathVariable UUID companyId, @PathVariable UUID roleId, @Valid @RequestBody UpdateRoleRequest request) { return ApiResponse.ok(service.update(companyId, roleId, request)); }
    @DeleteMapping("/{roleId}") @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_ROLE_DELETE)") public ApiResponse<Void> delete(@PathVariable UUID companyId, @PathVariable UUID roleId) { service.delete(companyId, roleId); return ApiResponse.ok(null); }
    @PutMapping("/{roleId}/permissions") @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_ROLE_ASSIGN_PERMISSION)") public ApiResponse<RoleResponse> replacePermissions(@PathVariable UUID companyId, @PathVariable UUID roleId, @Valid @RequestBody ReplaceRolePermissionsRequest request) { return ApiResponse.ok(service.replacePermissions(companyId, roleId, request)); }
    @GetMapping("/{roleId}/users") @PreAuthorize("@permissionChecker.hasPermission(T(com.greenops.agent.application.security.IamPermissions).COMPANY_USER_LIST)") public ApiResponse<PageResponse<RoleUserResponse>> users(@PathVariable UUID companyId, @PathVariable UUID roleId, Pageable pageable) { return ApiResponse.ok(service.users(companyId, roleId, pageable)); }
}
