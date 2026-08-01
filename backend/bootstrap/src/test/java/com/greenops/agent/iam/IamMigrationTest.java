package com.greenops.agent.iam;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class IamMigrationTest {

    @Test
    void systemRoleProtectionMigrationIsIdempotentAndProtectsIdentity() throws Exception {
        String sql;
        try (var stream = getClass().getResourceAsStream("/db/migration/V4__protect_system_roles.sql")) {
            assertThat(stream).isNotNull();
            sql = new String(stream.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();
        }

        assertThat(sql).contains("create or replace function protect_system_role")
                .contains("drop trigger if exists trg_roles_protect_system")
                .contains("before update or delete on roles")
                .contains("new.code is distinct from old.code")
                .contains("new.scope is distinct from old.scope")
                .contains("new.company_id is distinct from old.company_id")
                .contains("new.is_system is distinct from old.is_system")
                .contains("new.deleted_at is distinct from old.deleted_at")
                .contains("constraint = 'ck_roles_system_immutable'");
    }
}
