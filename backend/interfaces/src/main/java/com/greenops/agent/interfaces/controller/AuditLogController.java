package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.AuditLogResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.service.AuditLogService;
import com.greenops.agent.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/companies/{companyId}/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> list(
            @PathVariable UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String objectType,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) UUID entityId) {
        return ResponseEntity.ok(
                ApiResponse.ok(auditLogService.list(companyId, page, size, keyword, actionType, objectType, fromDate, toDate, entityId)));
    }
}
