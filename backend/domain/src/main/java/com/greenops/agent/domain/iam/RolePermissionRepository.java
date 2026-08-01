package com.greenops.agent.domain.iam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    @Query("SELECT grant FROM RolePermission grant JOIN FETCH grant.permission WHERE grant.role.id = :roleId")
    List<RolePermission> findByRoleId(@Param("roleId") UUID roleId);
    @Query("SELECT grant FROM RolePermission grant JOIN FETCH grant.permission WHERE grant.role.id IN :roleIds")
    List<RolePermission> findByRoleIdIn(@Param("roleIds") java.util.Collection<UUID> roleIds);
    boolean existsByRoleIdAndPermissionId(UUID roleId, UUID permissionId);
    boolean existsByPermissionId(UUID permissionId);
    void deleteAllByRoleIdAndPermissionIdIn(UUID roleId, java.util.Collection<UUID> permissionIds);
}
