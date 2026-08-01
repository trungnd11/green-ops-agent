package com.greenops.agent.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionConfigRepository extends JpaRepository<CommissionConfig, UUID> {

    @Query("SELECT c FROM CommissionConfig c WHERE c.driver.id = :driverId AND c.user.id = :userId")
    Optional<CommissionConfig> findByDriverIdAndUserId(@Param("driverId") UUID driverId, @Param("userId") UUID userId);

    @Query("SELECT c FROM CommissionConfig c WHERE c.driver.id = :driverId")
    Optional<CommissionConfig> findByDriverId(@Param("driverId") UUID driverId);

    @Query("SELECT c FROM CommissionConfig c WHERE c.user.id = :userId AND c.driver IS NULL")
    Optional<CommissionConfig> findByUserIdOnly(@Param("userId") UUID userId);

    @Query("SELECT c FROM CommissionConfig c WHERE c.user IS NULL AND c.driver IS NULL")
    Optional<CommissionConfig> findGlobal();
}
