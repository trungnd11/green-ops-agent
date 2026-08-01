package com.greenops.agent.domain.iam;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByCodeIgnoreCaseAndDeletedAtIsNull(String code);
    Optional<Permission> findByIdAndDeletedAtIsNull(UUID id);
    boolean existsByModuleIdAndResourceIgnoreCaseAndActionIgnoreCaseAndDeletedAtIsNull(UUID moduleId, String resource, String action);
    boolean existsByModuleIdAndDeletedAtIsNull(UUID moduleId);
    @EntityGraph(attributePaths = "module")
    Page<Permission> findByDeletedAtIsNull(Pageable pageable);
    @Query("SELECT permission FROM Permission permission JOIN FETCH permission.module module LEFT JOIN FETCH module.parent WHERE permission.status = com.greenops.agent.domain.iam.Status.ACTIVE AND permission.deletedAt IS NULL AND module.status = com.greenops.agent.domain.iam.Status.ACTIVE AND module.deletedAt IS NULL ORDER BY module.displayOrder, module.code, permission.code")
    List<Permission> findActiveTreeRows();
    List<Permission> findByModuleIdAndStatusAndDeletedAtIsNull(UUID moduleId, Status status);
    List<Permission> findByIdInAndDeletedAtIsNull(java.util.Collection<UUID> ids);
}
