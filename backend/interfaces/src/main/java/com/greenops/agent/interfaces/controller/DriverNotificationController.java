package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.application.service.NotificationService;
import com.greenops.agent.domain.Notification;
import com.greenops.agent.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/driver/notifications")
@RequiredArgsConstructor
public class DriverNotificationController {

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Notification>>> list(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID driverId = extractDriverId(authHeader);
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getDriverNotifications(driverId, pageable)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(
            @RequestHeader("Authorization") String authHeader) {
        UUID driverId = extractDriverId(authHeader);
        long count = notificationService.getUnreadCount(driverId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @RequestHeader("Authorization") String authHeader) {
        UUID driverId = extractDriverId(authHeader);
        notificationService.markAllAsRead(driverId);
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu đã đọc", null));
    }

    @PostMapping("/{id}/mark-read")
    public ResponseEntity<ApiResponse<Void>> markOneRead(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null, null));
    }

    private UUID extractDriverId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtTokenProvider.validateToken(token)) {
            throw new RuntimeException("Token không hợp lệ");
        }
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}
