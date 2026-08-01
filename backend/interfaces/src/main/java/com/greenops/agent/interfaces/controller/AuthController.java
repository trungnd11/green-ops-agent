package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.dto.twofa.Verify2FARequest;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.domain.User;
import com.greenops.agent.domain.UserRepository;
import com.greenops.agent.application.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", response));
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<ApiResponse<LoginResponse>> verify2fa(@RequestBody Verify2FARequest request) {
        LoginResponse response = authService.verify2fa(request.username(), request.otp());
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @RequestHeader("Authorization") String authHeader) {
        String refreshToken = authHeader.replace("Bearer ", "");
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok("Làm mới token thành công", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(CurrentUserResponse.from(user)));
    }

    public record ChangePasswordRequest(@NotBlank String newPassword) {}

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Đổi mật khẩu thành công"));
    }
}
