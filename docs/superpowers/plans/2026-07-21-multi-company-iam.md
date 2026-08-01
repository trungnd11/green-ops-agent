# Multi-company IAM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-ready multi-company membership, tenant-scoped roles and permissions, company context, IAM APIs, Flyway migrations, and backend authorization tests without breaking existing APIs.

**Architecture:** Extend the existing Gradle multi-module Spring Boot application incrementally. PostgreSQL/Flyway owns schema evolution; domain contains lazy JPA models and tenant-aware repositories; application contains transactional use cases and DTOs; infrastructure supplies request context/cache adapters; interfaces exposes secured controllers and filters.

**Tech Stack:** Java 17, Spring Boot 3.2.4, Gradle, Spring MVC, Spring Data JPA, Spring Security method authorization, PostgreSQL 15, Flyway, JJWT 0.12.5, JUnit 5, Spring Boot Test, Testcontainers PostgreSQL.

## Global Constraints

- Keep `users` and `companies`; retain `users.company_id` and `users.role` as deprecated compatibility fields.
- Permission decisions always include `userId`, `companyId`, and `permissionCode`; default deny.
- Apply tenant isolation to new IAM APIs; report legacy gaps without broad refactoring.
- Controllers return DTOs inside the existing `ApiResponse`, never JPA entities.
- Collections are lazy; do not use cascade remove.
- Do not introduce Redis; provide a no-op cache boundary with after-commit invalidation.
- Use Flyway only; use PostgreSQL JSONB and partial unique indexes.
- All write operations are transactional and validate complete input before mutation.
- Do not hard-code UUIDs, current company, passwords, tokens, or sensitive values.
- Workspace is not a Git repository: skip commit commands until Git metadata is available.

---

## File Structure

### Domain

Create focused IAM entities/enums under `backend/domain/src/main/java/com/tymui/agent/domain/iam/` and repositories under `.../domain/iam/repository/`. Each entity owns one table; repositories expose projections and tenant-qualified queries only.

### Application

Create DTOs under `backend/application/src/main/java/com/tymui/agent/application/dto/iam/`, constants under `.../security/`, exceptions/error codes under `.../exception/`, and IAM services under `.../service/iam/`. Services map entities to DTOs and own transactions.

### Infrastructure and Interfaces

Create company-context/cache implementations under `backend/infrastructure/src/main/java/com/tymui/agent/infrastructure/iam/`. Create filter, permission checker, and controllers under `backend/interfaces/src/main/java/com/tymui/agent/interfaces/`.

### Tests

Use PostgreSQL Testcontainers from `backend/bootstrap/src/test/java/com/tymui/agent/iam/` for migration/repository/integration behavior. Use application unit tests for delta and validation logic where database behavior is not required.

---

### Task 1: Flyway Foundation and IAM Migration

**Files:**
- Modify: `backend/bootstrap/build.gradle`
- Modify: `backend/bootstrap/src/main/resources/application.yml`
- Create: `backend/bootstrap/src/main/resources/db/migration/V1__baseline_marker.sql`
- Create: `backend/bootstrap/src/main/resources/db/migration/V2__create_multi_company_iam.sql`
- Create: `backend/bootstrap/src/main/resources/db/migration/V3__seed_iam.sql`
- Test: `backend/bootstrap/src/test/java/com/tymui/agent/iam/IamMigrationTest.java`

**Interfaces:**
- Produces tables `user_companies`, `modules`, `permissions`, `roles`, `role_permissions`, `user_company_roles`, `authorization_audit_logs` and seeded codes used by all later tasks.

- [ ] **Step 1: Add a failing PostgreSQL migration test**

Create `IamMigrationTest` using `PostgreSQLContainer<?>`, `Flyway.configure().dataSource(...).baselineOnMigrate(true).load().migrate()`, then assert via JDBC that all seven tables exist, all requested permission codes exist, `SUPER_ADMIN` exists, and its permission count equals the active permission count.

- [ ] **Step 2: Run the migration test and confirm dependency/compile failure**

Run: `backend\gradlew.bat :bootstrap:test --tests com.tymui.agent.iam.IamMigrationTest`

Expected: FAIL because Flyway/Testcontainers and migrations do not exist.

- [ ] **Step 3: Add dependencies and runtime configuration**

Add `org.flywaydb:flyway-core`, `org.flywaydb:flyway-database-postgresql`, `org.testcontainers:junit-jupiter`, and `org.testcontainers:postgresql` using Spring Boot-compatible versions. Configure Flyway enabled with `baseline-on-migrate: true`, baseline version `1`, locations `classpath:db/migration`; set JPA DDL mode to `validate` outside the isolated test profile.

- [ ] **Step 4: Implement migrations**

`V1__baseline_marker.sql` must be a harmless baseline marker for empty migration history. `V2` creates enums as varchar/check constraints, tables in FK order, required indexes, checks for role scope/effective ranges, and partial unique indexes where `deleted_at IS NULL`. Use `gen_random_uuid()` only after ensuring `pgcrypto` exists, or use PostgreSQL `uuid` defaults already supported by the current schema.

`V3` inserts modules and permissions by code with `ON CONFLICT DO NOTHING`, inserts `SUPER_ADMIN`, grants all active permissions, copies `users.company_id` to active memberships, and assigns `SUPER_ADMIN` to the sole active legacy user whose normalized role is `admin`. Abort with a clear PostgreSQL exception if more than one eligible legacy admin exists.

- [ ] **Step 5: Verify empty and populated migration paths**

Extend the test with a second database/schema setup containing minimal `companies` and quoted legacy `user`/actual user table discovered from `001-schema.sql`; insert one admin, migrate, and assert one membership and one system-role assignment with no duplicate after `migrate()` is called again.

Run: `backend\gradlew.bat :bootstrap:test --tests com.tymui.agent.iam.IamMigrationTest`

Expected: PASS.

---

### Task 2: IAM Domain Model and Repositories

**Files:**
- Create: `backend/domain/src/main/java/com/tymui/agent/domain/iam/*.java`
- Create: `backend/domain/src/main/java/com/tymui/agent/domain/iam/repository/*.java`
- Modify: `backend/domain/src/main/java/com/tymui/agent/domain/User.java`
- Test: `backend/bootstrap/src/test/java/com/tymui/agent/iam/IamRepositoryTest.java`

**Interfaces:**
- Produces enums `MembershipStatus`, `RoleStatus`, `RoleScope`, `AssignmentStatus`, `ModuleType`, `ModuleStatus`, `PermissionType`, `PermissionStatus`, `AuthorizationAuditAction`.
- Produces repositories including `UserCompanyRepository`, `RoleRepository`, `PermissionRepository`, `ModuleRepository`, `RolePermissionRepository`, `UserCompanyRoleRepository`, `AuthorizationAuditLogRepository`.

- [ ] **Step 1: Write failing repository tests**

Test unique membership, same company-role code rejected in one company but accepted across companies, invalid role scope rejected, lazy collections, and tenant-qualified role lookup returning empty for another company.

- [ ] **Step 2: Run and verify failure**

Run: `backend\gradlew.bat :bootstrap:test --tests com.tymui.agent.iam.IamRepositoryTest`

Expected: FAIL because entities/repositories are absent.

- [ ] **Step 3: Implement enums and entities**

Map exact migration column names, UUID IDs, audit timestamps, soft-delete fields, lazy `@ManyToOne`, and no bidirectional large collections unless a query requires them. Add entity-level table indexes/unique constraints where representable; document partial uniqueness through repository/migration tests rather than invalid JPA metadata. Mark legacy `User.company` and `User.role` accessors/fields `@Deprecated` without changing serialization behavior yet.

- [ ] **Step 4: Implement repositories and projections**

Required methods include:

```java
Optional<UserCompany> findByUserIdAndCompanyIdAndDeletedAtIsNull(UUID userId, UUID companyId);
Optional<Role> findByIdAndCompanyIdAndDeletedAtIsNull(UUID roleId, UUID companyId);
boolean existsByCompanyIdAndCodeIgnoreCaseAndDeletedAtIsNull(UUID companyId, String code);
boolean existsByRoleIdAndPermissionId(UUID roleId, UUID permissionId);
```

Add pageable membership/role queries with explicit joins/entity graphs limited to summary projections to prevent N+1.

- [ ] **Step 5: Run repository tests**

Run: `backend\gradlew.bat :bootstrap:test --tests com.tymui.agent.iam.IamRepositoryTest`

Expected: PASS.

---

### Task 3: Error Contract and Safe Current User Response

**Files:**
- Modify: `backend/application/src/main/java/com/tymui/agent/application/dto/ApiResponse.java`
- Modify: `backend/application/src/main/java/com/tymui/agent/application/exception/BusinessException.java`
- Modify: `backend/application/src/main/java/com/tymui/agent/application/exception/GlobalExceptionHandler.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/exception/ErrorCode.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/dto/CurrentUserResponse.java`
- Modify: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/controller/AuthController.java`
- Test: `backend/interfaces/src/test/java/com/tymui/agent/interfaces/controller/AuthControllerTest.java`
- Test: `backend/application/src/test/java/com/tymui/agent/application/exception/GlobalExceptionHandlerTest.java`

**Interfaces:**
- Produces `BusinessException(ErrorCode, String)` and stable `ApiResponse.errorCode`.

- [ ] **Step 1: Write failing MVC and handler tests**

Assert `/auth/me` JSON excludes `passwordHash` and `refreshToken`. Assert `ROLE_IS_IN_USE` maps to 409, `ACCESS_DENIED` to 403, not-found codes to 404, and generic errors return a fixed safe message without exception details.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `backend\gradlew.bat :interfaces:test :application:test --tests "*AuthControllerTest" --tests "*GlobalExceptionHandlerTest"`

Expected: FAIL on missing error code and unsafe entity response.

- [ ] **Step 3: Implement error model and DTO mapping**

Add every error code from the spec with its `HttpStatus`. Preserve existing wrapper fields and factories; add nullable `errorCode`. Return `CurrentUserResponse` from `/auth/me`, populated only with public profile/company compatibility fields.

- [ ] **Step 4: Implement safe exception handling**

Handle validation, authentication, access denied, data integrity, business, and generic failures. Log generic failures server-side; return no SQL/JWT/internal message.

- [ ] **Step 5: Run focused tests**

Expected: PASS.

---

### Task 4: Authorization Query and Service

**Files:**
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/AuthorizationService.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/security/CurrentCompanyProvider.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/security/IamPermissions.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/security/PermissionCache.java`
- Create: `backend/infrastructure/src/main/java/com/tymui/agent/infrastructure/iam/NoOpPermissionCache.java`
- Modify: relevant IAM repository query file from Task 2
- Test: `backend/bootstrap/src/test/java/com/tymui/agent/iam/AuthorizationServiceTest.java`

**Interfaces:**
- Produces:

```java
boolean hasPermission(UUID userId, UUID companyId, String permissionCode);
void requirePermission(String permissionCode);
Set<String> getEffectivePermissions(UUID userId, UUID companyId);
```

- [ ] **Step 1: Write the eight required failing authorization scenarios**

Create fixtures for granted, no grant, no membership, company mismatch, inactive role, inactive permission, inactive membership, expired assignment, and multi-role union. Assert direct denial and effective permission sets.

- [ ] **Step 2: Run and verify failure**

Run: `backend\gradlew.bat :bootstrap:test --tests com.tymui.agent.iam.AuthorizationServiceTest`

Expected: FAIL because authorization service/query is absent.

- [ ] **Step 3: Implement direct permission query**

Use JPQL/native SQL with predicates for user status, company status, membership status/effective dates, assignment status/effective dates, role status/scope/company, permission status/code, and soft-delete fields. Return `exists`/count for one code and distinct string projection for effective permissions.

- [ ] **Step 4: Implement service and constants**

`requirePermission` resolves authenticated user through the existing principal convention and company via `CurrentCompanyProvider`, throwing `COMPANY_CONTEXT_REQUIRED` or `ACCESS_DENIED`. Add every seeded permission constant; constructor is private.

- [ ] **Step 5: Run authorization tests**

Expected: PASS.

---

### Task 5: Company Context Filter and Method Security

**Files:**
- Create: `backend/infrastructure/src/main/java/com/tymui/agent/infrastructure/iam/RequestCompanyContext.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/CompanyAccessService.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/filter/CompanyContextFilter.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/security/PermissionChecker.java`
- Modify: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/config/SecurityConfig.java`
- Test: `backend/interfaces/src/test/java/com/tymui/agent/interfaces/security/CompanyContextSecurityTest.java`

**Interfaces:**
- `CurrentCompanyProvider.currentCompanyId(): Optional<UUID>`.
- `PermissionChecker.hasPermission(String permissionCode): boolean`.

- [ ] **Step 1: Write failing security tests**

Cover missing, malformed, nonexistent, inactive, non-member company header; exempt login/refresh/public/me-companies; valid membership; and method-security denial.

- [ ] **Step 2: Run and verify failure**

Run: `backend\gradlew.bat :interfaces:test --tests "*CompanyContextSecurityTest"`

Expected: FAIL.

- [ ] **Step 3: Implement request context and access validation**

Use a request-scoped bean where module wiring permits it. If ThreadLocal is necessary, encapsulate it in `RequestCompanyContext` and clear in filter `finally`. Validate authenticated `User`, company ACTIVE using current status representation, and active/effective membership.

- [ ] **Step 4: Wire filter and method security**

Add `@EnableMethodSecurity`, insert the context filter after JWT authentication, preserve existing URL rules, and ensure exception responses use the standard wrapper. Validate URL `{companyId}` inside company-scoped services/controllers against context.

- [ ] **Step 5: Run security tests**

Expected: PASS.

---

### Task 6: Membership Management API

**Files:**
- Create: `backend/application/src/main/java/com/tymui/agent/application/dto/iam/membership/*.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/CompanyMembershipService.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/controller/CompanyMembershipController.java`
- Test: `backend/application/src/test/java/com/tymui/agent/application/service/iam/CompanyMembershipServiceTest.java`
- Test: `backend/interfaces/src/test/java/com/tymui/agent/interfaces/controller/CompanyMembershipControllerTest.java`

**Interfaces:**
- Produces paged membership summary, create/update requests, and replace-role request.

- [ ] **Step 1: Write failing service tests**

Cover add with roles transaction, duplicate membership, company-role mismatch, inactive membership/role, invalid effective time, idempotent role replacement delta, removal without user deletion, assignment deactivation, audit invocation, and cache invalidation after commit.

- [ ] **Step 2: Run service tests and verify failure**

Run: `backend\gradlew.bat :application:test --tests "*CompanyMembershipServiceTest"`

Expected: FAIL.

- [ ] **Step 3: Implement DTOs and transactional service**

Implement list filters (`keyword`, `status`, `roleId`, `Pageable`), add, update, remove, and replace roles. Validate all role IDs before writes; reject system roles from company role-assignment endpoint; compute add/remove delta; preserve unchanged rows.

- [ ] **Step 4: Write and run failing controller tests**

Assert paths, validation, response wrapper, paging, context/path equality, and exact permission constants for each endpoint.

- [ ] **Step 5: Implement secured controller**

Use `@PreAuthorize` with `IamPermissions`; no business logic or entities in responses.

- [ ] **Step 6: Run membership tests**

Expected: PASS.

---

### Task 7: Company Role Management API

**Files:**
- Create: `backend/application/src/main/java/com/tymui/agent/application/dto/iam/role/*.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/CompanyRoleService.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/controller/CompanyRoleController.java`
- Test: `backend/application/src/test/java/com/tymui/agent/application/service/iam/CompanyRoleServiceTest.java`
- Test: `backend/interfaces/src/test/java/com/tymui/agent/interfaces/controller/CompanyRoleControllerTest.java`

**Interfaces:**
- Produces paged role summaries/details, create/update requests, replace-permission request, and assigned-user page.

- [ ] **Step 1: Write failing role service tests**

Cover create with permissions, duplicate code in same company, same code across companies, cross-company lookup, inactive permission, immutable system role, role-in-use conflict, and permission replacement delta/audit/cache invalidation.

- [ ] **Step 2: Run and verify failure**

Run: `backend\gradlew.bat :application:test --tests "*CompanyRoleServiceTest"`

Expected: FAIL.

- [ ] **Step 3: Implement transactional role service**

Normalize role code consistently, force `COMPANY`, current company, non-system, ACTIVE. Validate every permission before mutation. Soft-delete unused roles according to table fields; never delete system roles.

- [ ] **Step 4: Implement and test secured controller**

Add all seven specified endpoints, pagination, context/path equality, DTO-only responses, and permission mapping from the spec.

- [ ] **Step 5: Run role tests**

Expected: PASS.

---

### Task 8: Module and Permission Catalog APIs

**Files:**
- Create: `backend/application/src/main/java/com/tymui/agent/application/dto/iam/catalog/*.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/ModuleService.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/PermissionService.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/controller/ModuleController.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/controller/PermissionController.java`
- Test: `backend/application/src/test/java/com/tymui/agent/application/service/iam/PermissionTreeServiceTest.java`
- Test: `backend/interfaces/src/test/java/com/tymui/agent/interfaces/controller/IamCatalogControllerTest.java`

**Interfaces:**
- Produces ordered module tree and checkbox permission tree DTOs.

- [ ] **Step 1: Write failing tree and CRUD tests**

Cover deterministic parent/display ordering, inactive exclusion, no circular serialization, duplicate active code, duplicate active `(module, resource, action)`, parent validation, and soft deletion restrictions when children/permissions exist.

- [ ] **Step 2: Run and verify failure**

Run focused application/interfaces tests; expect FAIL.

- [ ] **Step 3: Implement projection-based tree assembly**

Fetch modules and permissions in bounded queries, group in memory by IDs without lazy traversal, and return the exact frontend-oriented shape. Avoid one query per node.

- [ ] **Step 4: Implement platform write guard**

Read endpoints use IAM list/view permissions. Write endpoints require authenticated effective `SUPER_ADMIN` system-role membership through a dedicated `AuthorizationService.isSystemRole(...)` query, not legacy `users.role`.

- [ ] **Step 5: Run catalog tests**

Expected: PASS.

---

### Task 9: Current User Companies, Permissions, and Menu

**Files:**
- Create: `backend/application/src/main/java/com/tymui/agent/application/dto/iam/me/*.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/CurrentUserIamService.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/controller/CurrentUserIamController.java`
- Test: `backend/interfaces/src/test/java/com/tymui/agent/interfaces/controller/CurrentUserIamControllerTest.java`

**Interfaces:**
- Produces `/me/companies`, `/me/permissions`, and `/me/menu` response DTOs.

- [ ] **Step 1: Write failing endpoint tests**

Assert company list needs no company header; permissions/menu require one; roles/permissions are distinct and sorted; menu excludes inactive/unpermitted modules and preserves tree/display order.

- [ ] **Step 2: Run and verify failure**

Run: `backend\gradlew.bat :interfaces:test --tests "*CurrentUserIamControllerTest"`

Expected: FAIL.

- [ ] **Step 3: Implement service queries and DTO mapping**

Use summary projections for memberships/roles, `AuthorizationService.getEffectivePermissions`, and catalog projection queries for menu. Do not serialize assignments/entities.

- [ ] **Step 4: Implement authenticated controller**

Use principal identity from SecurityContext only; never accept user ID from request.

- [ ] **Step 5: Run current-user tests**

Expected: PASS.

---

### Task 10: Authorization Audit and After-commit Cache Invalidation

**Files:**
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/AuthorizationAuditService.java`
- Create: `backend/application/src/main/java/com/tymui/agent/application/service/iam/PermissionCacheInvalidator.java`
- Create: `backend/interfaces/src/main/java/com/tymui/agent/interfaces/iam/HttpAuditMetadataProvider.java`
- Modify: membership/role/catalog services from Tasks 6-8
- Test: `backend/application/src/test/java/com/tymui/agent/application/service/iam/AuthorizationAuditServiceTest.java`

**Interfaces:**
- `record(action, entityType, entityId, actorUserId, companyId, oldData, newData)`.
- `evictAfterCommit(UUID userId, UUID companyId)` and role-dependent bulk eviction.

- [ ] **Step 1: Write failing audit/invalidation tests**

Assert required action codes, JSON old/new data, actor/company, no token/password fields, IP/user-agent truncation, no cache eviction on rollback, and eviction after commit.

- [ ] **Step 2: Run and verify failure**

Expected: FAIL.

- [ ] **Step 3: Implement audit serialization and metadata provider**

Use the existing configured Jackson mapper, immutable DTO snapshots, and explicit allowlisted fields. Store JSONB through the mapped entity type supported by Hibernate 6.

- [ ] **Step 4: Implement transaction synchronization**

Use `TransactionSynchronizationManager.registerSynchronization` only when synchronization is active; otherwise evict immediately. Role-permission changes query affected active memberships and evict each `(user, company)` key.

- [ ] **Step 5: Run audit/invalidation tests**

Expected: PASS.

---

### Task 11: Full IAM Integration and Security Regression Suite

**Files:**
- Create: `backend/bootstrap/src/test/java/com/tymui/agent/iam/IamApiIntegrationTest.java`
- Create: `backend/bootstrap/src/test/java/com/tymui/agent/iam/IamTenantIsolationTest.java`
- Modify: test application/configuration files required for Testcontainers dynamic properties

**Interfaces:**
- Validates all public IAM contracts end-to-end against PostgreSQL and Spring Security.

- [ ] **Step 1: Build reusable two-company fixtures**

Create users: super admin, company A manager, company B viewer, and outsider. Create company-local roles with the same code, memberships, effective assignments, and distinct permissions.

- [ ] **Step 2: Add failing API integration scenarios**

Cover every requested missing/invalid header, nonmembership, no permission, cross-company role, duplicate role, duplicate allowed across companies, system-role deletion, and membership removal scenario.

- [ ] **Step 3: Add failing security isolation scenarios**

Change header company, URL company, user ID, role ID, and permission ID independently. Each cross-company attempt must return 403 or tenant-safe 404 according to service contract, never data from another company.

- [ ] **Step 4: Run suite and fix only observed defects**

Run: `backend\gradlew.bat :bootstrap:test --tests "com.tymui.agent.iam.*IntegrationTest" --tests "com.tymui.agent.iam.*IsolationTest"`

Expected after fixes: PASS.

- [ ] **Step 5: Run all backend tests**

Run: `backend\gradlew.bat clean test`

Expected: BUILD SUCCESSFUL.

---

### Task 12: Migration Drill, Build, and Delivery Report

**Files:**
- Modify: `database/001-schema.sql` only if required to prevent conflict for brand-new Docker databases
- Modify: `docker-compose.yml` only if required to route new environments through Flyway rather than duplicate IAM DDL
- Create: `docs/iam-migration-and-api-guide.md`

**Interfaces:**
- Produces operator migration instructions, API examples, final file inventory, and known-gap report requested by the specification.

- [ ] **Step 1: Run an empty-database migration drill**

Start PostgreSQL 15 with a fresh volume, apply baseline/current schema strategy, start the application, and verify Flyway history plus seeded IAM records. Capture exact commands and expected Flyway versions in the guide.

- [ ] **Step 2: Run a populated-database migration drill**

Create a current-schema database with companies and the sole admin, run migrations, and query membership/system-role counts. Verify no user/company deletion and no duplicate after restart.

- [ ] **Step 3: Run final static verification**

Run:

```powershell
backend\gradlew.bat clean test build
```

Expected: `BUILD SUCCESSFUL` with no failing tests.

If Gradle exposes a separate lint/check task, run `backend\gradlew.bat check`; expected success. No frontend command is required because this delivery does not modify frontend source.

- [ ] **Step 4: Write the delivery guide**

Include: current architecture analysis, DB/migration changes, created/modified files, final ER diagram, API list, permission map, company context flow, authorization query logic, tests, deferred legacy tenant gaps, migration commands, and concrete curl request/response examples.

- [ ] **Step 5: Verify documentation against implementation**

Check every documented endpoint/path/header/error code against controller tests and generated routes. Search for `TBD`, `TODO`, guessed commands, secrets, and hard-coded UUIDs; remove all such content.

---

## Plan Self-review

- Spec coverage: all database objects, seed/migration, domain, context, authorization, membership, role, catalog, current-user APIs, audit, cache boundary, transactions, error codes, tests, verification, and deferred-risk reporting are assigned to tasks.
- Type consistency: `CurrentCompanyProvider`, `PermissionCache`, `AuthorizationService`, `PermissionChecker`, and service/controller boundaries are defined before consumers.
- Scope control: legacy business-module tenant refactoring, driver auth hardening, Redis, refresh-session redesign, cookies, RLS, and shared BaseEntity remain deferred.
- Placeholder scan: no implementation placeholder is permitted; concrete behavior, files, commands, and expected results are specified per task.
