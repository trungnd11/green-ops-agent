package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.service.AdminTaskService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class AdminTaskController {

    private final AdminTaskService adminTaskService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminTaskResponse>>> getTasks(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(adminTaskService.getTasks(status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTaskResponse>> getTask(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(adminTaskService.getTask(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminTaskResponse>> createTask(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AdminTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tạo công việc thành công",
                adminTaskService.createTask(request, user.getId())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminTaskResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công",
                adminTaskService.updateStatus(id, body.get("status"), null)));
    }
}
