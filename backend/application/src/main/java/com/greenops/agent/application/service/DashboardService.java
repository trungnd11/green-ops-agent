package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.*;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final DriverRepository driverRepository;
    private final RevenuePeriodRepository revenuePeriodRepository;
    private final RevenueDetailRepository revenueDetailRepository;
    private final CompanyRepository companyRepository;

    public DashboardResponse getDashboard(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        long totalDrivers = driverRepository.countByCompanyIdAndStatus(companyId, "active")
                + driverRepository.countByCompanyIdAndStatus(companyId, "suspended");
        long activeDrivers = driverRepository.countByCompanyIdAndStatus(companyId, "active");
        long resignedDrivers = driverRepository.countByCompanyIdAndStatus(companyId, "resigned");

        return DashboardResponse.builder()
                .totalDrivers(totalDrivers + resignedDrivers)
                .activeDrivers(activeDrivers)
                .resignedDrivers(resignedDrivers)
                .build();
    }
}
