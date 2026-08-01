package com.greenops.agent.domain;

import com.greenops.agent.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByCompanyIdAndUsername(UUID companyId, String username);

    Page<User> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    @Query("SELECT u.status, COUNT(u) FROM User u WHERE u.company.id = :companyId GROUP BY u.status")
    java.util.List<Object[]> countByStatus(@Param("companyId") UUID companyId);
}
