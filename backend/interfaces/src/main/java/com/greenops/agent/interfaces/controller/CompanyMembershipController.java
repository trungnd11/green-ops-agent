package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.iam.membership.*;
import com.greenops.agent.application.service.iam.CompanyMembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/companies/{companyId}/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CompanyMembershipController {
    private final CompanyMembershipService service;
    @GetMapping
    public ApiResponse<PageResponse<MembershipResponse>> list(@PathVariable UUID companyId, @RequestParam(required=false) String keyword, @RequestParam(required=false) com.greenops.agent.domain.iam.MembershipStatus status, @RequestParam(required=false) UUID roleId, Pageable pageable) { return ApiResponse.ok(service.list(companyId, keyword, status, roleId, pageable)); }
    @PostMapping
    public ApiResponse<MembershipResponse> create(@PathVariable UUID companyId, @Valid @RequestBody CreateMembershipRequest request) { return ApiResponse.ok(service.create(companyId, request)); }
    @PutMapping("/{userId}")
    public ApiResponse<MembershipResponse> update(@PathVariable UUID companyId, @PathVariable UUID userId, @Valid @RequestBody UpdateMembershipRequest request) { return ApiResponse.ok(service.update(companyId, userId, request)); }
    @DeleteMapping("/{userId}")
    public ApiResponse<Void> remove(@PathVariable UUID companyId, @PathVariable UUID userId) { service.remove(companyId, userId); return ApiResponse.ok(null); }
    @PutMapping("/{userId}/roles")
    public ApiResponse<MembershipResponse> replaceRoles(@PathVariable UUID companyId, @PathVariable UUID userId, @Valid @RequestBody ReplaceMembershipRolesRequest request) { return ApiResponse.ok(service.replaceRoles(companyId, userId, request)); }
}
