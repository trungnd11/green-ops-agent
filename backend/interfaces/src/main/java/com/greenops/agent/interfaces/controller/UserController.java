package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.dto.UserCompanyResponse;
import com.greenops.agent.application.service.UserService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> listUsers(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.listByCompany(user.getCompany().getId(), page, size, keyword, role, status)));
    }

    @GetMapping("/{id}/companies")
    public ResponseEntity<ApiResponse<List<UserCompanyResponse>>> userCompanies(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        List<UserCompanyResponse> companies = userService.getUserCompanies(id).stream()
                .map(m -> new UserCompanyResponse(
                        m.getCompany().getId(), m.getCompany().getCode(),
                        m.getCompany().getName(), m.isDefaultCompany(),
                        m.getStatus() == com.greenops.agent.domain.iam.MembershipStatus.ACTIVE))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(companies));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> userStats(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.getStats(user.getCompany().getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.getById(user.getCompany().getId(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Thêm người dùng thành công",
                        userService.create(user.getCompany().getId(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody UserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Cập nhật người dùng thành công",
                        userService.update(user.getCompany().getId(), id, request)));
    }

    @GetMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<UserRolesResponse>> userRoles(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok(userService.getUserRoles(user.getCompany().getId(), id)));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody DeactivateUserRequest request) {
        userService.deactivate(user.getCompany().getId(), id, request.getReason(), request.getNote());
        return ResponseEntity.ok(ApiResponse.ok("Khóa tài khoản thành công", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        userService.delete(user.getCompany().getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa người dùng thành công", null));
    }
}
