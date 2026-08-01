package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.iam.catalog.ModuleTreeResponse;
import com.greenops.agent.application.dto.iam.me.*;
import com.greenops.agent.application.security.CurrentCompanyProvider;
import com.greenops.agent.application.service.iam.CurrentUserIamService;
import com.greenops.agent.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class CurrentUserIamController {
    private final CurrentUserIamService service;
    private final CurrentCompanyProvider company;
    @GetMapping("/companies") public ApiResponse<List<CurrentCompanyResponse>> companies(Authentication authentication) { return ApiResponse.ok(service.companies(user(authentication).getId())); }
    @GetMapping("/permissions") public ApiResponse<CurrentPermissionsResponse> permissions(Authentication authentication) { return ApiResponse.ok(service.permissions(user(authentication).getId(), company.requireCurrentCompanyId())); }
    @GetMapping("/menu") public ApiResponse<List<ModuleTreeResponse>> menu(Authentication authentication) { return ApiResponse.ok(service.menu(user(authentication).getId(), company.requireCurrentCompanyId())); }
    private User user(Authentication authentication) { return (User) authentication.getPrincipal(); }
}
