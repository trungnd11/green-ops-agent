package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.DriverRequest;
import com.greenops.agent.application.dto.DriverResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.Driver;
import com.greenops.agent.domain.User;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.CompanyRepository;
import com.greenops.agent.domain.DriverRepository;
import com.greenops.agent.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverService {

    private final DriverRepository driverRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<DriverResponse> getDrivers(UUID companyId, String search, String status, Pageable pageable) {
        Page<Driver> driverPage;
        if (search != null && !search.isEmpty()) {
            driverPage = driverRepository.search(companyId, search, pageable);
        } else if (status != null && !status.isEmpty()) {
            driverPage = driverRepository.findByCompanyIdAndStatus(companyId, status, pageable);
        } else {
            driverPage = driverRepository.findByCompanyId(companyId, pageable);
        }

        return toPageResponse(driverPage);
    }

    @Transactional(readOnly = true)
    public DriverResponse getDriver(UUID companyId, UUID driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", driverId));
        if (!driver.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Tài xế", driverId);
        }
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse createDriver(UUID companyId, DriverRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Công ty", companyId));

        if (driverRepository.existsByCompanyIdAndDriverCode(companyId, request.getDriverCode())) {
            throw new BusinessException("Mã LX '" + request.getDriverCode() + "' đã tồn tại");
        }

        Driver driver = Driver.builder()
                .company(company)
                .driverCode(request.getDriverCode())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .cccd(request.getCccd())
                .cccdIssueDate(request.getCccdIssueDate())
                .cccdIssuePlace(request.getCccdIssuePlace())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .address(request.getAddress())
                .licenseNumber(request.getLicenseNumber())
                .licenseClass(request.getLicenseClass())
                .joinDate(request.getJoinDate())
                .resignDate(request.getResignDate())
                .status(request.getStatus() != null ? request.getStatus() : "active")
                .depositAmount(request.getDepositAmount() != null ? request.getDepositAmount() : java.math.BigDecimal.ZERO)
                .note(request.getNote())
                .referrer(request.getReferrerId() != null
                        ? userRepository.findById(request.getReferrerId())
                                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", request.getReferrerId()))
                        : null)
                .build();

        driver = driverRepository.save(driver);
        log.info("Created driver: {} - {}", driver.getDriverCode(), driver.getFullName());
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse updateDriver(UUID companyId, UUID driverId, DriverRequest request) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", driverId));

        if (!driver.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Tài xế", driverId);
        }

        if (request.getDriverCode() != null) driver.setDriverCode(request.getDriverCode());
        if (request.getFullName() != null) driver.setFullName(request.getFullName());
        if (request.getPhone() != null) driver.setPhone(request.getPhone());
        if (request.getEmail() != null) driver.setEmail(request.getEmail());
        if (request.getCccd() != null) driver.setCccd(request.getCccd());
        if (request.getCccdIssueDate() != null) driver.setCccdIssueDate(request.getCccdIssueDate());
        if (request.getCccdIssuePlace() != null) driver.setCccdIssuePlace(request.getCccdIssuePlace());
        if (request.getBirthDate() != null) driver.setBirthDate(request.getBirthDate());
        if (request.getGender() != null) driver.setGender(request.getGender());
        if (request.getAddress() != null) driver.setAddress(request.getAddress());
        if (request.getLicenseNumber() != null) driver.setLicenseNumber(request.getLicenseNumber());
        if (request.getLicenseClass() != null) driver.setLicenseClass(request.getLicenseClass());
        if (request.getJoinDate() != null) driver.setJoinDate(request.getJoinDate());
        if (request.getResignDate() != null) driver.setResignDate(request.getResignDate());
        if (request.getStatus() != null) driver.setStatus(request.getStatus());
        if (request.getDepositAmount() != null) driver.setDepositAmount(request.getDepositAmount());
        if (request.getNote() != null) driver.setNote(request.getNote());
        if (request.getReferrerId() != null) {
            driver.setReferrer(userRepository.findById(request.getReferrerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người dùng", request.getReferrerId())));
        }

        if ("resigned".equals(driver.getStatus()) && driver.getResignDate() == null) {
            driver.setResignDate(java.time.LocalDate.now());
        }

        driver = driverRepository.save(driver);
        log.info("Updated driver: {} - {}", driver.getDriverCode(), driver.getFullName());
        return toResponse(driver);
    }

    public Map<String, Long> getDriverStats(UUID companyId) {
        Map<String, Long> stats = new HashMap<>();
        stats.put("active", driverRepository.countByCompanyIdAndStatus(companyId, "active"));
        stats.put("inactive", driverRepository.countByCompanyIdAndStatus(companyId, "inactive"));
        stats.put("blocked", driverRepository.countByCompanyIdAndStatus(companyId, "blocked"));
        stats.put("suspended", driverRepository.countByCompanyIdAndStatus(companyId, "suspended"));
        stats.put("resigned", driverRepository.countByCompanyIdAndStatus(companyId, "resigned"));
        return stats;
    }

    @Transactional
    public void deleteDriver(UUID companyId, UUID driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", driverId));
        if (!driver.getCompany().getId().equals(companyId)) {
            throw new ResourceNotFoundException("Tài xế", driverId);
        }
        driver.setStatus("resigned");
        driver.setResignDate(java.time.LocalDate.now());
        driverRepository.save(driver);
        log.info("Deactivated driver: {} - {}", driver.getDriverCode(), driver.getFullName());
    }

    private DriverResponse toResponse(Driver driver) {
        return DriverResponse.builder()
                .id(driver.getId())
                .driverCode(driver.getDriverCode())
                .fullName(driver.getFullName())
                .phone(driver.getPhone())
                .email(driver.getEmail())
                .cccd(driver.getCccd())
                .birthDate(driver.getBirthDate())
                .gender(driver.getGender())
                .address(driver.getAddress())
                .licenseNumber(driver.getLicenseNumber())
                .licenseClass(driver.getLicenseClass())
                .joinDate(driver.getJoinDate())
                .resignDate(driver.getResignDate())
                .status(driver.getStatus())
                .depositAmount(driver.getDepositAmount())
                .note(driver.getNote())
                .referrerId(driver.getReferrer() != null ? driver.getReferrer().getId() : null)
                .referrerName(driver.getReferrer() != null ? driver.getReferrer().getFullName() : null)
                .createdAt(driver.getCreatedAt())
                .updatedAt(driver.getUpdatedAt())
                .build();
    }

    private PageResponse<DriverResponse> toPageResponse(Page<Driver> page) {
        return PageResponse.<DriverResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
