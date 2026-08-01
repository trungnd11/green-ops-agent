package com.greenops.agent.domain.iam;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AuthorizationAuditLogRepository extends JpaRepository<AuthorizationAuditLog, UUID>, JpaSpecificationExecutor<AuthorizationAuditLog> {
    Page<AuthorizationAuditLog> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);
}
