package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.CompanyDetailResponse;
import com.greenops.agent.application.dto.CompanyRequest;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyDetailResponse getById(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Công ty", id));
        return toResponse(company);
    }

    @Transactional
    public CompanyDetailResponse create(CompanyRequest request) {
        if (companyRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Mã công ty '" + request.getCode() + "' đã tồn tại");
        }

        Company company = Company.builder()
                .code(request.getCode())
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .taxCode(request.getTaxCode())
                .contactPerson(request.getContactPerson())
                .status(request.getStatus() != null ? request.getStatus() : "active")
                .build();

        company = companyRepository.save(company);
        log.info("Created company: {} - {}", company.getCode(), company.getName());
        return toResponse(company);
    }

    @Transactional
    public CompanyDetailResponse update(UUID id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Công ty", id));

        if (request.getCode() != null && !request.getCode().equals(company.getCode())) {
            if (companyRepository.existsByCode(request.getCode())) {
                throw new BusinessException("Mã công ty '" + request.getCode() + "' đã tồn tại");
            }
            company.setCode(request.getCode());
        }
        if (request.getName() != null) company.setName(request.getName());
        if (request.getAddress() != null) company.setAddress(request.getAddress());
        if (request.getPhone() != null) company.setPhone(request.getPhone());
        if (request.getEmail() != null) company.setEmail(request.getEmail());
        if (request.getTaxCode() != null) company.setTaxCode(request.getTaxCode());
        if (request.getContactPerson() != null) company.setContactPerson(request.getContactPerson());
        if (request.getStatus() != null) company.setStatus(request.getStatus());

        company = companyRepository.save(company);
        log.info("Updated company: {} - {}", company.getCode(), company.getName());
        return toResponse(company);
    }

    @Transactional
    public void delete(UUID id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Công ty", id));
        company.setStatus("inactive");
        companyRepository.save(company);
        log.info("Deactivated company: {} - {}", company.getCode(), company.getName());
    }

    private CompanyDetailResponse toResponse(Company company) {
        return CompanyDetailResponse.builder()
                .id(company.getId())
                .code(company.getCode())
                .name(company.getName())
                .address(company.getAddress())
                .phone(company.getPhone())
                .email(company.getEmail())
                .taxCode(company.getTaxCode())
                .contactPerson(company.getContactPerson())
                .logoUrl(company.getLogoUrl())
                .status(company.getStatus())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
