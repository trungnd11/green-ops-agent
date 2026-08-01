package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.iam.catalog.*;
import com.greenops.agent.application.service.iam.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
public class PermissionController {
    private final PermissionService service;
    @GetMapping @PreAuthorize("@permissionChecker.hasPermission(authentication, T(com.greenops.agent.application.security.IamPermissions).PERMISSION_LIST)") public ApiResponse<PageResponse<PermissionResponse>> list(Pageable pageable) { return ApiResponse.ok(service.list(pageable)); }
    @GetMapping("/tree") @PreAuthorize("@permissionChecker.hasPermission(authentication, T(com.greenops.agent.application.security.IamPermissions).PERMISSION_VIEW)") public ApiResponse<List<PermissionTreeResponse>> tree() { return ApiResponse.ok(service.tree()); }
    @PostMapping @PreAuthorize("@permissionChecker.isSuperAdmin(authentication)") public ApiResponse<PermissionResponse> create(@Valid @RequestBody PermissionRequest request) { return ApiResponse.ok(service.create(request)); }
    @PutMapping("/{id}") @PreAuthorize("@permissionChecker.isSuperAdmin(authentication)") public ApiResponse<PermissionResponse> update(@PathVariable UUID id, @Valid @RequestBody PermissionRequest request) { return ApiResponse.ok(service.update(id, request)); }
    @DeleteMapping("/{id}") @PreAuthorize("@permissionChecker.isSuperAdmin(authentication)") public ApiResponse<Void> delete(@PathVariable UUID id) { service.delete(id); return ApiResponse.ok(null); }
}
