package com.greenops.agent.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    Page<Complaint> findByStatus(String status, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.driver.id = :driverId ORDER BY c.createdAt DESC")
    Page<Complaint> findByDriverId(@Param("driverId") UUID driverId, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status")
    long countByStatus(@Param("status") String status);
}
