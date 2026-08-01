package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.dto.SettlementDetailResponse;
import com.greenops.agent.domain.*;
import com.greenops.agent.application.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Settlement>>> getSettlements(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                ApiResponse.ok(settlementService.getSettlements(user.getCompany().getId(), pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Settlement>> getSettlement(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok(settlementService.getSettlement(user.getCompany().getId(), id)));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ApiResponse<List<SettlementDetailResponse>>> getSettlementDetails(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok(settlementService.getSettlementDetails(user.getCompany().getId(), id)));
    }

    @PostMapping("/create/{periodId}")
    public ResponseEntity<ApiResponse<Settlement>> createSettlement(
            @AuthenticationPrincipal User user,
            @PathVariable UUID periodId) {
        return ResponseEntity.ok(
                ApiResponse.ok("Tạo quyết toán thành công",
                        settlementService.createSettlement(
                                user.getCompany().getId(), periodId, user.getId())));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Settlement>> approveSettlement(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Phê duyệt quyết toán thành công",
                        settlementService.approveSettlement(
                                user.getCompany().getId(), id, user.getId())));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<Settlement>> confirmPaid(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok("Xác nhận thanh toán thành công",
                        settlementService.confirmPaid(user.getCompany().getId(), id)));
    }
}
