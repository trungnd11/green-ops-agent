package com.greenops.agent.iam;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class MigrationContractTest {

    @Test
    void baselineCreatesLegacyForeignKeyTargetsBeforeIamMigration() throws IOException {
        String baseline = migration("V1__baseline_marker.sql");
        String iam = migration("V2__create_multi_company_iam.sql");

        assertThat(baseline.indexOf("create table company")).isGreaterThanOrEqualTo(0);
        assertThat(baseline.indexOf("create table \"user\"")).isGreaterThan(baseline.indexOf("create table company"));
        assertThat(iam).contains("references \"user\"(id)", "references company(id)");
    }

    @Test
    void baselineContainsSchemaOnly() throws IOException {
        String baseline = migration("V1__baseline_marker.sql");

        assertThat(baseline).doesNotContain("admin123", "insert into", "password:", "default password");
    }

    private String migration(String name) throws IOException {
        try (var stream = getClass().getResourceAsStream("/db/migration/" + name)) {
            assertThat(stream).isNotNull();
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();
        }
    }
}
