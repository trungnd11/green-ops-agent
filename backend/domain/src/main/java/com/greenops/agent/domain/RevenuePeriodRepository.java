package com.greenops.agent.domain;

import com.greenops.agent.domain.RevenuePeriod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevenuePeriodRepository extends JpaRepository<RevenuePeriod, UUID> {

    Page<RevenuePeriod> findByCompanyIdOrderByStartDateDesc(UUID companyId, Pageable pageable);

    Optional<RevenuePeriod> findByCompanyIdAndStartDateAndEndDate(
            UUID companyId, LocalDate startDate, LocalDate endDate);

    boolean existsByCompanyIdAndStartDateAndEndDate(
            UUID companyId, LocalDate startDate, LocalDate endDate);

    List<RevenuePeriod> findByCompanyIdAndStatus(UUID companyId, String status);

    @Query("SELECT rp FROM RevenuePeriod rp WHERE rp.company.id = :companyId " +
           "AND rp.status = :status AND rp.endDate >= :from AND rp.startDate <= :to")
    List<RevenuePeriod> findOverlapping(@Param("companyId") UUID companyId,
                                        @Param("status") String status,
                                        @Param("from") LocalDate from,
                                        @Param("to") LocalDate to);
}
