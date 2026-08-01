package com.greenops.agent.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AdminTaskRepository extends JpaRepository<AdminTask, UUID> {

    Page<AdminTask> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<AdminTask> findByAssigneeIdOrderByCreatedAtDesc(UUID assigneeId, Pageable pageable);

    long countByStatus(String status);
}
