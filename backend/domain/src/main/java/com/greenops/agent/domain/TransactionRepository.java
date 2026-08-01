package com.greenops.agent.domain;

import com.greenops.agent.domain.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    Page<Transaction> findByDriverIdOrderByCreatedAtDesc(UUID driverId, Pageable pageable);

    Page<Transaction> findByDriverIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID driverId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Transaction> findByTransactionTypeOrderByCreatedAtDesc(
            String transactionType, Pageable pageable);

    Page<Transaction> findByDriverIdAndTransactionTypeOrderByCreatedAtDesc(
            UUID driverId, String transactionType, Pageable pageable);
}
