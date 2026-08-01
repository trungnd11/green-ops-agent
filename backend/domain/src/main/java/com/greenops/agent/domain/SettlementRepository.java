package com.greenops.agent.domain;

import com.greenops.agent.domain.Settlement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {

    Page<Settlement> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    Optional<Settlement> findByCompanyIdAndPeriodId(UUID companyId, UUID periodId);

    boolean existsByCompanyIdAndPeriodId(UUID companyId, UUID periodId);
}
