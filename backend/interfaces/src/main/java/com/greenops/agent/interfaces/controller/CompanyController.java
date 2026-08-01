package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.ApiResponse;
import com.greenops.agent.application.dto.CompanyDetailResponse;
import com.greenops.agent.application.dto.CompanyRequest;
import com.greenops.agent.application.service.CompanyService;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BasicCompanyResponse>>> list() {
        List<BasicCompanyResponse> list = companyRepository.findAll().stream()
                .map(c -> new BasicCompanyResponse(c.getId(), c.getCode(), c.getName(), c.getStatus(), c.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDetailResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyDetailResponse>> create(@RequestBody CompanyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Thêm công ty thành công", companyService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDetailResponse>> update(@PathVariable UUID id, @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật công ty thành công", companyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        companyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa công ty thành công", null));
    }

    public record BasicCompanyResponse(UUID id, String code, String name, String status, LocalDateTime createdAt) {}
}
