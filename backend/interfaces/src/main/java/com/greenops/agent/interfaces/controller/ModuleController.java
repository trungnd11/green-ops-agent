package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.iam.catalog.*;
import com.greenops.agent.application.service.iam.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/modules")
@RequiredArgsConstructor
public class ModuleController {
    private final ModuleService service;
    @GetMapping("/tree") @PreAuthorize("@permissionChecker.hasPermission(authentication, T(com.greenops.agent.application.security.IamPermissions).MODULE_LIST)") public ApiResponse<List<ModuleTreeResponse>> tree() { return ApiResponse.ok(service.tree()); }
    @PostMapping @PreAuthorize("@permissionChecker.isSuperAdmin(authentication)") public ApiResponse<ModuleTreeResponse> create(@Valid @RequestBody ModuleRequest request) { return ApiResponse.ok(service.create(request)); }
    @PutMapping("/{id}") @PreAuthorize("@permissionChecker.isSuperAdmin(authentication)") public ApiResponse<ModuleTreeResponse> update(@PathVariable UUID id, @Valid @RequestBody ModuleRequest request) { return ApiResponse.ok(service.update(id, request)); }
    @DeleteMapping("/{id}") @PreAuthorize("@permissionChecker.isSuperAdmin(authentication)") public ApiResponse<Void> delete(@PathVariable UUID id) { service.delete(id); return ApiResponse.ok(null); }
}
