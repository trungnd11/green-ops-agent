package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.infrastructure.security.JwtTokenProvider;
import com.greenops.agent.application.service.DriverAuthService;
import com.greenops.agent.application.service.DriverPortalService;
import com.greenops.agent.application.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/driver")
@RequiredArgsConstructor
public class DriverPortalController {

    private final DriverAuthService driverAuthService;
    private final DriverPortalService driverPortalService;
    private final ComplaintService complaintService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<DriverLoginResponse>> login(
            @Valid @RequestBody DriverLoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Đăng nhập thành công", driverAuthService.login(request)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DriverDashboardResponse>> dashboard(
            @RequestHeader("Authorization") String authHeader) {
        UUID driverId = extractDriverId(authHeader);
        return ResponseEntity.ok(
                ApiResponse.ok(driverPortalService.getDashboard(driverId)));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<DriverProfileResponse>> profile(
            @RequestHeader("Authorization") String authHeader) {
        UUID driverId = extractDriverId(authHeader);
        return ResponseEntity.ok(
                ApiResponse.ok(driverPortalService.getProfile(driverId)));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<?>> revenueHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String keyword) {
        UUID driverId = extractDriverId(authHeader);
        return ResponseEntity.ok(
                ApiResponse.ok(driverPortalService.getRevenueHistory(driverId, keyword)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<?>> transactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type) {
        UUID driverId = extractDriverId(authHeader);
        return ResponseEntity.ok(
                ApiResponse.ok(driverPortalService.getTransactions(driverId, page, size, type)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody WithdrawRequest request) {
        UUID driverId = extractDriverId(authHeader);
        driverPortalService.requestWithdraw(driverId, request);
        return ResponseEntity.ok(ApiResponse.ok("Yêu cầu rút tiền đã được ghi nhận", null));
    }

    @PostMapping("/topup")
    public ResponseEntity<ApiResponse<Void>> topup(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody TopupRequest request) {
        UUID driverId = extractDriverId(authHeader);
        driverPortalService.requestTopup(driverId, request);
        return ResponseEntity.ok(ApiResponse.ok("Yêu cầu nạp tiền đã được ghi nhận", null));
    }

    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> driverComplaints(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID driverId = extractDriverId(authHeader);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ApiResponse.ok(complaintService.getDriverComplaints(driverId, pageable)));
    }

    @PostMapping("/complaints")
    public ResponseEntity<ApiResponse<ComplaintResponse>> createDriverComplaint(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ComplaintRequest request) {
        UUID driverId = extractDriverId(authHeader);
        request.setDriverId(driverId);
        return ResponseEntity.ok(ApiResponse.ok("Gửi khiếu nại thành công",
                complaintService.createComplaint(request, driverId, true)));
    }

    private UUID extractDriverId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtTokenProvider.validateToken(token)) {
            throw new ResourceNotFoundException("Token không hợp lệ");
        }
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}
