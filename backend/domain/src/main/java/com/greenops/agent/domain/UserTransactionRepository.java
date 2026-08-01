package com.greenops.agent.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface UserTransactionRepository extends JpaRepository<UserTransaction, UUID> {

    Page<UserTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<UserTransaction> findByStatus(String status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.transactionType = 'commission' AND t.status = 'APPROVED' THEN t.amount ELSE 0 END), 0) - " +
           "COALESCE(SUM(CASE WHEN t.transactionType = 'withdrawal' AND t.status = 'APPROVED' THEN -t.amount ELSE 0 END), 0) " +
           "FROM UserTransaction t WHERE t.user.id = :userId")
    BigDecimal calculateAvailableBalance(@Param("userId") UUID userId);
}
