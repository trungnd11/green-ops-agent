package com.greenops.agent.interfaces.config;

import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.User;
import com.greenops.agent.domain.CompanyRepository;
import com.greenops.agent.domain.UserRepository;
import com.greenops.agent.domain.iam.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final RoleRepository roleRepository;
    private final UserCompanyRoleRepository userCompanyRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${LOCAL_ADMIN_PASSWORD:}")
    private String localAdminPassword;

    @Override
    public void run(String... args) {
        if (localAdminPassword.isBlank()) {
            log.info("LOCAL_ADMIN_PASSWORD is not configured, skipping local seed");
            return;
        }
        if (companyRepository.findByCode("GREENOPS").isPresent()) {
            log.info("Seed data already exists, skipping");
            return;
        }

        Company company = Company.builder()
                .code("GREENOPS")
                .name("GREENOPS TRANSPORT")
                .address("Hà Nội")
                .phone("0912345678")
                .taxCode("0123456789")
                .status("active")
                .build();
        company = companyRepository.save(company);
        log.info("Created default company: {}", company.getCode());

        User admin = User.builder()
                .company(company)
                .username("admin")
                .passwordHash(passwordEncoder.encode(localAdminPassword))
                .fullName("Quản trị viên")
                .email("admin@greenops.vn")
                .status("active")
                .build();
        userRepository.save(admin);

        UserCompany membership = userCompanyRepository.save(UserCompany.builder()
                .user(admin).company(company).owner(true).defaultCompany(true)
                .status(MembershipStatus.ACTIVE).joinedAt(LocalDateTime.now()).effectiveFrom(LocalDateTime.now())
                .build());

        roleRepository.findByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(company.getId(), "SUPER_ADMIN")
                .ifPresent(role -> userCompanyRoleRepository.save(UserCompanyRole.builder()
                        .userCompany(membership).role(role).status(Status.ACTIVE).effectiveFrom(LocalDateTime.now())
                        .build()));

        log.info("Created default admin user with membership");
    }
}
