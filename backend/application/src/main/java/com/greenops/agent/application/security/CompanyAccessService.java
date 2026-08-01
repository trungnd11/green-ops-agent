package com.greenops.agent.application.security;

import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ErrorCode;
import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.CompanyRepository;
import com.greenops.agent.domain.iam.MembershipStatus;
import com.greenops.agent.domain.iam.UserCompany;
import com.greenops.agent.domain.iam.UserCompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyAccessService {
    private final CompanyRepository companyRepository;
    private final UserCompanyRepository membershipRepository;

    public void validateAccess(UUID userId, UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND, "Công ty không tồn tại"));
        if (!"active".equalsIgnoreCase(company.getStatus())) {
            throw new BusinessException(ErrorCode.COMPANY_INACTIVE, "Công ty không hoạt động");
        }
        UserCompany membership = membershipRepository.findByUserIdAndCompanyIdAndDeletedAtIsNull(userId, companyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBERSHIP_NOT_FOUND, "Người dùng không thuộc công ty"));
        LocalDateTime now = LocalDateTime.now();
        if (membership.getStatus() != MembershipStatus.ACTIVE
                || membership.getEffectiveFrom() != null && membership.getEffectiveFrom().isAfter(now)
                || membership.getEffectiveTo() != null && !membership.getEffectiveTo().isAfter(now)) {
            throw new BusinessException(ErrorCode.MEMBERSHIP_INACTIVE, "Tư cách thành viên không hoạt động");
        }
    }
}
