package com.greenops.agent.domain;

import com.greenops.agent.domain.Driver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<Driver, UUID> {

    Optional<Driver> findByCompanyIdAndDriverCode(UUID companyId, String driverCode);

    List<Driver> findByDriverCode(String driverCode);

    boolean existsByCompanyIdAndDriverCode(UUID companyId, String driverCode);

    Page<Driver> findByCompanyId(UUID companyId, Pageable pageable);

    Page<Driver> findByCompanyIdAndStatus(UUID companyId, String status, Pageable pageable);

    @Query("SELECT d FROM Driver d WHERE d.company.id = :companyId " +
           "AND (:search IS NULL OR d.fullName ILIKE %:search% " +
           "OR d.driverCode ILIKE %:search% " +
           "OR d.phone ILIKE %:search% " +
           "OR d.cccd ILIKE %:search%)")
    Page<Driver> search(@Param("companyId") UUID companyId,
                        @Param("search") String search,
                        Pageable pageable);

    @Query("SELECT d FROM Driver d WHERE d.company.id = :companyId " +
           "AND d.driverCode IN :codes")
    List<Driver> findByCompanyIdAndDriverCodeIn(@Param("companyId") UUID companyId,
                                                @Param("codes") List<String> codes);

    long countByCompanyIdAndStatus(UUID companyId, String status);

    Optional<Driver> findByPhone(String phone);
}
