package com.greenops.agent.domain.iam;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCompanyRepository extends JpaRepository<UserCompany, UUID> {
    Optional<UserCompany> findByIdAndCompanyIdAndDeletedAtIsNull(UUID id, UUID companyId);
    Optional<UserCompany> findByUserIdAndCompanyIdAndDeletedAtIsNull(UUID userId, UUID companyId);
    @EntityGraph(attributePaths = "user")
    @Query("SELECT DISTINCT membership FROM UserCompany membership JOIN membership.user user LEFT JOIN UserCompanyRole assignment ON assignment.userCompany = membership AND assignment.status = com.greenops.agent.domain.iam.Status.ACTIVE LEFT JOIN assignment.role role WHERE membership.company.id = :companyId AND membership.deletedAt IS NULL AND (:keyword IS NULL OR LOWER(user.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(membership.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND (:status IS NULL OR membership.status = :status) AND (:roleId IS NULL OR role.id = :roleId)")
    Page<UserCompany> findMemberships(@Param("companyId") UUID companyId, @Param("keyword") String keyword, @Param("status") MembershipStatus status, @Param("roleId") UUID roleId, Pageable pageable);
    boolean existsByUserIdAndCompanyIdAndDeletedAtIsNull(UUID userId, UUID companyId);
    @EntityGraph(attributePaths = {"company", "user"})
    @Query("SELECT membership FROM UserCompany membership JOIN membership.user user WHERE user.id = :userId AND membership.deletedAt IS NULL AND membership.status = com.greenops.agent.domain.iam.MembershipStatus.ACTIVE AND (membership.effectiveFrom IS NULL OR membership.effectiveFrom <= :at) AND (membership.effectiveTo IS NULL OR membership.effectiveTo > :at) ORDER BY membership.company.name, membership.company.id")
    List<UserCompany> findEffectiveCompanies(@Param("userId") UUID userId, @Param("at") LocalDateTime at);
}
