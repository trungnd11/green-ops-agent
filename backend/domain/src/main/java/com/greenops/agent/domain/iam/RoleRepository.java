package com.greenops.agent.domain.iam;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    @Query("SELECT r FROM Role r WHERE r.id = :id AND r.deletedAt IS NULL AND (r.scope = com.greenops.agent.domain.iam.RoleScope.SYSTEM OR r.company.id = :companyId)")
    Optional<Role> findAccessibleById(@Param("id") UUID id, @Param("companyId") UUID companyId);
    @Query("SELECT r FROM Role r WHERE r.deletedAt IS NULL AND (r.scope = com.greenops.agent.domain.iam.RoleScope.SYSTEM OR r.company.id = :companyId) ORDER BY r.name")
    Page<Role> findAccessible(@Param("companyId") UUID companyId, Pageable pageable);
    Optional<Role> findByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(UUID companyId, String code);
    Optional<Role> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);
    boolean existsByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(UUID companyId, String code);
    Page<Role> findByCompanyIdAndDeletedAtIsNull(UUID companyId, Pageable pageable);
}
