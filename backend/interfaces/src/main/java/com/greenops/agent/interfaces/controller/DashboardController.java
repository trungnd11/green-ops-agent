package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.DashboardResponse;
import com.greenops.agent.domain.User;
import com.greenops.agent.application.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                ApiResponse.ok(dashboardService.getDashboard(user.getCompany().getId())));
    }
}
