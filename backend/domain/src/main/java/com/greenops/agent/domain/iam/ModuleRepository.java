package com.greenops.agent.domain.iam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModuleRepository extends JpaRepository<Module, UUID> {
    Optional<Module> findByCodeIgnoreCaseAndDeletedAtIsNull(String code);
    Optional<Module> findByIdAndDeletedAtIsNull(UUID id);
    boolean existsByParentIdAndDeletedAtIsNull(UUID parentId);
    @Query("SELECT module FROM Module module LEFT JOIN FETCH module.parent WHERE module.status = com.greenops.agent.domain.iam.Status.ACTIVE AND module.deletedAt IS NULL ORDER BY module.displayOrder, module.code, module.id")
    List<Module> findActiveTreeRows();
    List<Module> findByStatusAndDeletedAtIsNullOrderByDisplayOrderAsc(Status status);
}
