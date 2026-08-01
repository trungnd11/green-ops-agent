package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.User;
import com.greenops.agent.application.service.RevenueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/revenue")
@RequiredArgsConstructor
public class RevenueController {

    private final RevenueService revenueService;

    // ========== Periods ==========

    @GetMapping("/periods")
    public ResponseEntity<ApiResponse<PageResponse<RevenuePeriodResponse>>> getPeriods(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startDate"));
        return ResponseEntity.ok(
                ApiResponse.ok(revenueService.getPeriods(user.getCompany().getId(), pageable)));
    }

    @GetMapping("/periods/{id}")
    public ResponseEntity<ApiResponse<RevenuePeriodResponse>> getPeriod(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok(revenueService.getPeriod(user.getCompany().getId(), id)));
    }

    @PostMapping("/periods")
    public ResponseEntity<ApiResponse<RevenuePeriodResponse>> createPeriod(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RevenuePeriodRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Tạo kỳ báo cáo thành công",
                        revenueService.createPeriod(user.getCompany().getId(), request)));
    }

    @PatchMapping("/periods/{id}/status")
    public ResponseEntity<ApiResponse<RevenuePeriodResponse>> updatePeriodStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestParam String status) {
        return ResponseEntity.ok(
                ApiResponse.ok("Cập nhật trạng thái thành công",
                        revenueService.updatePeriodStatus(user.getCompany().getId(), id, status)));
    }

    // ========== Import Excel ==========

    @PostMapping(value = "/periods/{id}/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RevenueService.ImportResult>> importExcel(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        RevenueService.ImportResult result = revenueService.importExcel(user.getCompany().getId(), id, file);
        String message = "Import " + result.getSuccessRows() + "/" + result.getTotalRows()
                + " dòng thành công" + (result.getErrorRows() > 0 ?
                ", " + result.getErrorRows() + " lỗi" : "");
        return ResponseEntity.ok(ApiResponse.ok(message, result));
    }

    // ========== Revenue Details ==========

    @GetMapping("/periods/{periodId}/details")
    public ResponseEntity<ApiResponse<PageResponse<RevenueDetailResponse>>> getDetails(
            @AuthenticationPrincipal User user,
            @PathVariable UUID periodId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                ApiResponse.ok(revenueService.getRevenueDetails(user.getCompany().getId(), periodId, pageable)));
    }

    @GetMapping("/periods/{periodId}/details/{detailId}")
    public ResponseEntity<ApiResponse<RevenueDetailResponse>> getDetail(
            @AuthenticationPrincipal User user,
            @PathVariable UUID periodId,
            @PathVariable UUID detailId) {
        return ResponseEntity.ok(
                ApiResponse.ok(revenueService.getRevenueDetail(user.getCompany().getId(), periodId, detailId)));
    }
}
