package com.greenops.agent.domain;

import com.greenops.agent.domain.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    Optional<Contract> findByContractNumber(String contractNumber);

    Page<Contract> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    Page<Contract> findByDriverIdOrderByCreatedAtDesc(UUID driverId, Pageable pageable);

    @Query("SELECT c FROM Contract c WHERE c.driver.id = :driverId AND c.status = 'active'")
    Optional<Contract> findActiveByDriverId(@Param("driverId") UUID driverId);

    @Query("SELECT c FROM Contract c WHERE c.company.id = :companyId " +
           "AND (:status IS NULL OR c.status = :status)")
    Page<Contract> findByCompanyIdAndStatus(@Param("companyId") UUID companyId,
                                            @Param("status") String status,
                                            Pageable pageable);
}
