package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.User;
import com.greenops.agent.application.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DriverResponse>>> getDrivers(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(
                ApiResponse.ok(driverService.getDrivers(user.getCompany().getId(), search, status, pageable)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getDriverStats(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                ApiResponse.ok(driverService.getDriverStats(user.getCompany().getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DriverResponse>> getDriver(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.ok(driverService.getDriver(user.getCompany().getId(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DriverResponse>> createDriver(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DriverRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Thêm tài xế thành công",
                        driverService.createDriver(user.getCompany().getId(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DriverResponse>> updateDriver(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody DriverRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Cập nhật tài xế thành công",
                        driverService.updateDriver(user.getCompany().getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDriver(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        driverService.deleteDriver(user.getCompany().getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa tài xế thành công", null));
    }
}
