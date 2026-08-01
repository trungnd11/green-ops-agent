package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.service.CommissionService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/commissions")
@RequiredArgsConstructor
public class CommissionController {

    private final CommissionService commissionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CommissionLogResponse>>> getCommissions(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID periodId,
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                commissionService.getPendingCommissions(periodId, status, pageable)));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<Void>> reviewCommission(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody CommissionReviewRequest request) {
        commissionService.reviewCommission(id, request, user.getId());
        String msg = switch (request.getAction()) {
            case "approve" -> "Duyệt hoa hồng thành công";
            case "adjust" -> "Đã chỉnh sửa và duyệt hoa hồng";
            case "reject" -> "Đã từ chối hoa hồng";
            default -> "Thành công";
        };
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }

    @PostMapping("/calculate/{periodId}")
    public ResponseEntity<ApiResponse<Void>> calculateCommissions(
            @AuthenticationPrincipal User user,
            @PathVariable UUID periodId) {
        commissionService.calculateCommissions(periodId);
        return ResponseEntity.ok(ApiResponse.ok("Tính hoa hồng thành công", null));
    }
}
