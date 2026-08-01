package com.greenops.agent.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionLogRepository extends JpaRepository<CommissionLog, UUID> {

    Optional<CommissionLog> findByPeriodIdAndDriverId(UUID periodId, UUID driverId);

    Page<CommissionLog> findByPeriodIdAndStatus(UUID periodId, String status, Pageable pageable);

    Page<CommissionLog> findByStatus(String status, Pageable pageable);

    @Query("SELECT c FROM CommissionLog c WHERE c.status = :status AND c.createdAt >= :from AND c.createdAt < :to")
    Page<CommissionLog> findByStatusAndDateRange(
            @Param("status") String status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    List<CommissionLog> findByReferrerIdAndStatus(UUID referrerId, String status);
}
