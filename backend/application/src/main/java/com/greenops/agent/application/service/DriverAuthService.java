package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.DriverLoginRequest;
import com.greenops.agent.application.dto.DriverLoginResponse;
import com.greenops.agent.domain.Driver;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.DriverRepository;
import com.greenops.agent.domain.TokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverAuthService {

    private final DriverRepository driverRepository;
    private final TokenProvider jwtTokenProvider;

    public DriverLoginResponse login(DriverLoginRequest request) {
        String identifier = request.getIdentifier().trim();

        // Try finding by driverCode first
        Driver driver = null;
        if (request.getCompanyId() != null) {
            driver = driverRepository.findByCompanyIdAndDriverCode(
                    request.getCompanyId(), identifier)
                    .orElse(null);
        }
        if (driver == null) {
            List<Driver> drivers = driverRepository.findByDriverCode(identifier);
            if (!drivers.isEmpty()) {
                driver = drivers.get(0);
            }
        }

        // If not found by driverCode, try by phone
        if (driver == null) {
            var byPhone = driverRepository.findByPhone(identifier);
            if (byPhone.isPresent()) {
                driver = byPhone.get();
            }
        }

        if (driver == null) {
            throw new ResourceNotFoundException("Tài xế", identifier);
        }

        if (!"active".equals(driver.getStatus())) {
            throw new BusinessException("Tài khoản tài xế đã bị khóa");
        }

        String token = jwtTokenProvider.generateToken(
                driver.getId(), driver.getDriverCode(), "DRIVER");

        return DriverLoginResponse.builder()
                .driverId(driver.getId())
                .driverCode(driver.getDriverCode())
                .fullName(driver.getFullName())
                .phone(driver.getPhone())
                .token(token)
                .companyId(driver.getCompany().getId())
                .build();
    }
}
