package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.User;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class IamMappingTest {

    @Test
    void exposesAllIamEntitiesAndEnums() throws Exception {
        assertThat(List.of(UserCompany.class, Module.class, Permission.class, Role.class,
                RolePermission.class, UserCompanyRole.class, AuthorizationAuditLog.class)).allMatch(type -> type.isAnnotationPresent(jakarta.persistence.Entity.class));
        assertThat(MembershipStatus.values()).extracting(Enum::name).containsExactly("INVITED", "ACTIVE", "INACTIVE", "REMOVED");
        assertThat(ModuleType.values()).extracting(Enum::name).containsExactly("GROUP", "MODULE", "FEATURE");
        assertThat(Status.values()).extracting(Enum::name).containsExactly("ACTIVE", "INACTIVE");
        assertThat(PermissionType.values()).extracting(Enum::name).containsExactly("MENU", "PAGE", "BUTTON", "API", "DATA");
        assertThat(RoleScope.values()).extracting(Enum::name).containsExactly("SYSTEM", "COMPANY");
    }

    @Test
    void relationshipsAreLazyAndDoNotCascadeRemove() {
        for (Class<?> type : List.of(UserCompany.class, Module.class, Permission.class, Role.class,
                RolePermission.class, UserCompanyRole.class, AuthorizationAuditLog.class)) {
            for (Field field : type.getDeclaredFields()) {
                ManyToOne manyToOne = field.getAnnotation(ManyToOne.class);
                if (manyToOne != null) {
                    assertThat(manyToOne.fetch()).as(type.getSimpleName() + "." + field.getName()).isEqualTo(FetchType.LAZY);
                    assertThat(manyToOne.cascade()).doesNotContain(jakarta.persistence.CascadeType.REMOVE);
                }
                OneToMany oneToMany = field.getAnnotation(OneToMany.class);
                if (oneToMany != null) {
                    assertThat(oneToMany.fetch()).isEqualTo(FetchType.LAZY);
                    assertThat(oneToMany.cascade()).doesNotContain(jakarta.persistence.CascadeType.REMOVE);
                }
            }
        }
    }

    @Test
    void legacyUserFieldsRemainAvailableAndDeprecated() throws Exception {
        assertThat(User.class.getDeclaredField("company").isAnnotationPresent(Deprecated.class)).isTrue();
        assertThat(User.class.getDeclaredField("role").isAnnotationPresent(Deprecated.class)).isTrue();
    }

    @Test
    void authorizationRepositoryUsesDirectTenantAwareProjection() throws Exception {
        var method = UserCompanyRoleRepository.class.getMethod("findEffectivePermissions", java.util.UUID.class, java.util.UUID.class, java.time.LocalDateTime.class);
        assertThat(method.getReturnType()).isEqualTo(Set.class);
        Query query = method.getAnnotation(Query.class);
        assertThat(query).isNotNull();
        assertThat(query.value()).contains("company.id = :companyId", "permission.code", "deletedAt IS NULL");
        assertThat(method.getGenericReturnType().getTypeName()).contains("PermissionGrant");
    }
}
