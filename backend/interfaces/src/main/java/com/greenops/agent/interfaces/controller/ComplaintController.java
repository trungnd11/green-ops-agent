package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.service.ComplaintService;
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
@RequestMapping("/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> getComplaints(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getComplaints(status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getComplaint(id)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ComplaintStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getStats()));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> getMyComplaints(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(complaintService.getDriverComplaints(user.getId(), pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Gửi khiếu nại thành công",
                complaintService.createComplaint(request, user.getId(), false)));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<ApiResponse<ComplaintResponse>> respondComplaint(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody ComplaintRespondRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Phản hồi khiếu nại thành công",
                complaintService.respondComplaint(id, request, user.getId())));
    }
}
