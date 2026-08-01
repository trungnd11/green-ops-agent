package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.twofa.Enable2FARequest;
import com.greenops.agent.application.dto.twofa.TwoFAStatusResponse;
import com.greenops.agent.application.service.twofa.TwoFAService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/2fa")
@RequiredArgsConstructor
public class TwoFAController {

    private final TwoFAService twoFAService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<TwoFAStatusResponse>> status(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(twoFAService.getStatus(user.getId())));
    }

    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<TwoFAStatusResponse>> setup(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(twoFAService.getSetupInfo(user.getId())));
    }

    @PostMapping("/enable")
    public ResponseEntity<ApiResponse<String>> enable(@AuthenticationPrincipal User user,
                                                       @Valid @RequestBody Enable2FARequest request) {
        if (twoFAService.enable(user.getId(), request.otp())) {
            return ResponseEntity.ok(ApiResponse.ok("Đã bật xác thực hai lớp"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Mã OTP không hợp lệ"));
    }

    @PostMapping("/disable")
    public ResponseEntity<ApiResponse<String>> disable(@AuthenticationPrincipal User user) {
        twoFAService.disable(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Đã tắt xác thực hai lớp"));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verify(@AuthenticationPrincipal User user,
                                                        @Valid @RequestBody Enable2FARequest request) {
        return ResponseEntity.ok(ApiResponse.ok(twoFAService.verify(user.getId(), request.otp())));
    }
}
