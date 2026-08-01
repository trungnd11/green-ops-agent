# Multi-company IAM Design

Date: 2026-07-21
Status: Approved

## 1. Scope

Implement multi-company membership and role-based authorization without rewriting the existing system. Add Flyway, IAM database objects, domain models, repositories, services, APIs, company request context, Spring Security integration, authorization audit logging, and automated tests.

The first delivery applies mandatory tenant isolation to the new IAM module. Existing business modules are reviewed and documented but are not broadly refactored in this change to avoid breaking current APIs.

Existing `users.company_id` and `users.role` remain temporarily for backward compatibility and are deprecated. They are not authoritative for new permission checks.

## 2. Current Architecture

The backend uses Java 17, Spring Boot 3.2.4, Gradle multi-project, Spring MVC, Spring Data JPA, Spring Security, PostgreSQL, and JWT. Modules are:

- `domain`: entities and Spring Data repositories.
- `application`: DTOs, services, business exceptions, response wrappers.
- `infrastructure`: JWT and supporting infrastructure.
- `interfaces`: controllers, filters, and security configuration.
- `bootstrap`: runtime application and configuration.

Current users have a required many-to-one company relationship and a single role string. Authentication uses stateless JWT and loads the current user from the database in the authentication filter. There is no migration framework, reusable base entity, request company context, permission model, application cache, or backend test suite.

Important existing risks to report but not broadly refactor in this delivery include transaction queries without tenant predicates, manually parsed driver JWTs, method-security annotations without confirmed enablement, and direct entity serialization from `/auth/me`.

## 3. Architectural Approach

Use incremental integration rather than a big-bang tenant rewrite:

1. Introduce Flyway and establish the current schema as the baseline.
2. Add IAM schema and migrate existing user-company data idempotently.
3. Add focused domain models and repositories following current module conventions.
4. Add validated request-scoped company context.
5. Add query-based authorization and Spring method security.
6. Add IAM APIs and audit logging.
7. Add PostgreSQL-backed repository, service, integration, and security tests.
8. Document legacy tenant-isolation gaps for later work.

No Redis dependency is introduced. Authorization caching is hidden behind an interface with a no-op first implementation and after-commit invalidation hooks.

## 4. Data Model

### 4.1 Existing Tables

Keep `users` and `companies`. Preserve `users.company_id` and `users.role` as deprecated compatibility fields. Existing user-company associations are copied to `user_companies` without duplicates.

### 4.2 New Tables

#### `user_companies`

Membership between a user and company. Contains employee metadata, ownership/default flags, status, validity dates, timestamps, auditing users, and soft-delete timestamp. Enforce unique `(user_id, company_id)` and indexes on both foreign keys.

Statuses: `INVITED`, `ACTIVE`, `INACTIVE`, `REMOVED`.

#### `modules`

Hierarchical IAM navigation/function modules with self-referencing `parent_id`, type, route, icon, ordering, status, audit fields, and soft delete.

Types: `GROUP`, `MODULE`, `FEATURE`.

Use a PostgreSQL partial unique index for active `code` values where `deleted_at IS NULL`.

#### `permissions`

Atomic permissions linked to modules. Contains code, resource, action, type, status, audit fields, and soft delete.

Types: `MENU`, `PAGE`, `BUTTON`, `API`, `DATA`.

Use partial unique indexes for active `code` and active `(module_id, resource, action)`.

#### `roles`

System or company role. A check constraint enforces:

- `scope = SYSTEM`: `company_id IS NULL`.
- `scope = COMPANY`: `company_id IS NOT NULL`.

System role codes are globally unique; company role codes are unique per company through PostgreSQL partial unique indexes. System roles cannot have their code changed or be deleted.

#### `role_permissions`

Associates roles and permissions, preserving grant actor and time. Enforce unique `(role_id, permission_id)` and index both foreign keys.

#### `user_company_roles`

Associates a membership with roles, preserving assignment status, actor, time, and effective range. Enforce unique `(user_company_id, role_id)` and index both foreign keys.

Application validation requires an active membership, active role, valid effective period, and matching company for company-scoped roles. Company-scoped role-management APIs cannot assign system roles. The migration assigns `SUPER_ADMIN` only to the sole existing legacy admin; later system-role assignments require a dedicated platform-administration workflow outside this delivery.

#### `authorization_audit_logs`

Append-only authorization-change log with action, entity details, actor, company, old/new JSONB data, IP address, user agent, and timestamp.

### 4.3 Entity Relationships

```text
User 1 --- N UserCompany N --- 1 Company
                   |
                   1
                   |
                   N
           UserCompanyRole N --- 1 Role
                                      |
                                      1
                                      |
                                      N
                              RolePermission N --- 1 Permission N --- 1 Module
                                                                         |
                                                                         N
                                                                         |
                                                                         1 parent Module

AuthorizationAuditLog ---> actor User
AuthorizationAuditLog ---> optional Company
```

Collections remain lazy. Controllers never return JPA entities. No cascade remove is used for authorization relationships.

## 5. Flyway Migration Design

Flyway becomes the sole versioned migration mechanism. Hibernate is moved toward `validate`, while legacy SQL initialization remains only where needed for compatibility during transition.

Migration sequence:

1. Baseline the existing production schema safely.
2. Create IAM tables in foreign-key order.
3. Create constraints and required indexes, including PostgreSQL partial unique indexes.
4. Seed IAM root and child modules.
5. Seed all requested IAM permissions.
6. Seed the `SUPER_ADMIN` system role.
7. Assign every active IAM permission to `SUPER_ADMIN`.
8. Insert memberships from existing `users.company_id` using conflict-safe SQL.
9. Identify the current sole legacy admin and assign `SUPER_ADMIN` without creating a new account.

Migration requirements:

- Safe on populated databases.
- No deletion of users or companies.
- No duplicate memberships or grants.
- No hard-coded record UUID assumptions; deterministic database-generated IDs or lookup-by-code is used.
- PostgreSQL JSONB and partial indexes are tested on PostgreSQL, not only H2.

## 6. Company Context

### 6.1 Components

- `CompanyContext`: request-scoped representation of the validated company.
- `CompanyContextFilter`: reads and validates `X-Company-Id`.
- `CurrentCompanyProvider`: exposes the current company ID to application services.
- `CompanyAccessService`: validates company status and active membership.

### 6.2 Request Flow

1. Spring Security authenticates the user.
2. The filter reads `X-Company-Id` for company-scoped endpoints.
3. The header is parsed as UUID.
4. The company must exist and be active.
5. The current user must have an active and currently effective membership.
6. The validated context is available only for the request.
7. Context is cleared in `finally` if ThreadLocal storage is required; static mutable state is prohibited.

Header exemptions include login, refresh token, `/api/v1/me/companies`, and public endpoints.

For endpoints containing `{companyId}`, the path company must equal the validated context. A user cannot switch tenant by modifying either the header or path.

## 7. Authorization

### 7.1 Service Contract

```java
boolean hasPermission(UUID userId, UUID companyId, String permissionCode);
void requirePermission(String permissionCode);
Set<String> getEffectivePermissions(UUID userId, UUID companyId);
```

### 7.2 Evaluation Rules

Permission checks require:

1. Active user.
2. Active company.
3. Active, currently effective membership.
4. Active, currently effective user-company role assignment.
5. Active role.
6. System role or company role belonging to the same company.
7. Active permission.
8. Default deny when no matching permission exists.

A direct repository query checks `(userId, companyId, permissionCode)` instead of loading a complete entity graph and iterating in memory. Effective permissions use a distinct projection query.

### 7.3 Spring Security

Enable method security. Add `PermissionChecker`, which resolves authenticated user and validated company context, then delegates to `AuthorizationService`.

Controllers use permission constants, for example:

```java
@PreAuthorize("@permissionChecker.hasPermission(T(...IamPermissions).COMPANY_USER_LIST)")
```

Permission strings are centralized in `IamPermissions`. Frontend visibility is never treated as authorization.

### 7.4 Cache Boundary

Define an authorization permission cache keyed by `auth:permissions:{userId}:{companyId}`. Initial implementation is no-op because no cache infrastructure exists. Invalidation calls occur after successful transaction commit when membership, assignment, role, or permission data changes. A future Redis/Caffeine implementation can be added without changing services.

## 8. APIs

All endpoints use the existing `/api/v1` context path and `ApiResponse` wrapper.

### 8.1 Membership

- `GET /companies/{companyId}/users`
- `POST /companies/{companyId}/users`
- `PUT /companies/{companyId}/users/{userId}`
- `DELETE /companies/{companyId}/users/{userId}`
- `PUT /companies/{companyId}/users/{userId}/roles`

Lists support keyword, status, role, pagination, and sorting. Removal marks membership `REMOVED`, disables active assignments, records audit events, and does not delete the user.

### 8.2 Company Roles

- `GET /companies/{companyId}/roles`
- `GET /companies/{companyId}/roles/{roleId}`
- `POST /companies/{companyId}/roles`
- `PUT /companies/{companyId}/roles/{roleId}`
- `DELETE /companies/{companyId}/roles/{roleId}`
- `PUT /companies/{companyId}/roles/{roleId}/permissions`
- `GET /companies/{companyId}/roles/{roleId}/users`

Created roles are company-scoped, non-system, and active. Cross-company access is rejected. System roles are immutable. Roles in use return HTTP 409.

### 8.3 Modules and Permissions

- `GET /modules/tree`
- `GET /permissions`
- `GET /permissions/tree`
- `POST /modules`
- `PUT /modules/{moduleId}`
- `DELETE /modules/{moduleId}`
- `POST /permissions`
- `PUT /permissions/{permissionId}`
- `DELETE /permissions/{permissionId}`

Write operations require platform-level `SUPER_ADMIN` authority. Tree responses are DTO projections suitable for frontend menu and checkbox trees.

### 8.4 Current User

- `GET /me/companies`
- `GET /me/permissions` with `X-Company-Id`
- `GET /me/menu` with `X-Company-Id`

The menu contains only active modules represented by the user's effective menu/page permissions. `/me/companies` is company-header exempt.

## 9. Permission Mapping

| API | Permission |
|---|---|
| List company users | `iam.company-user.list` |
| View company user | `iam.company-user.view` |
| Add company user | `iam.company-user.create` |
| Update membership | `iam.company-user.update` |
| Remove membership | `iam.company-user.remove` |
| Replace user roles | `iam.company-user.assign-role` |
| List company roles | `iam.company-role.list` |
| View company role | `iam.company-role.view` |
| Create company role | `iam.company-role.create` |
| Update company role | `iam.company-role.update` |
| Delete company role | `iam.company-role.delete` |
| Replace role permissions | `iam.company-role.assign-permission` |
| List permissions | `iam.permission.list` |
| View permission/tree | `iam.permission.view` |
| Create permission | `iam.permission.create` |
| Update permission | `iam.permission.update` |
| Delete permission | `iam.permission.delete` |
| List module/tree | `iam.module.list` |
| Create module | `iam.module.create` |
| Update module | `iam.module.update` |
| Delete module | `iam.module.delete` |

Current-user company, permission, and menu endpoints require authentication and validated membership. They expose the current user's own authorization state rather than administrative IAM operations.

## 10. Transactions and Concurrency

Transactional operations:

- Add user membership and initial roles.
- Replace membership roles.
- Create role and initial permissions.
- Replace role permissions.
- Remove membership.

Replacement workflow:

1. Validate all IDs and tenant ownership before writing.
2. Load current assignments using bounded queries.
3. Compute additions, removals, and unchanged assignments.
4. Preserve unchanged audit metadata.
5. Add or deactivate only the delta.
6. Write audit records.
7. Schedule cache invalidation after commit.

Duplicate requests are idempotent. Unique constraints protect races; data-integrity violations are mapped to stable conflict errors.

## 11. Errors and API Compatibility

Add error codes:

- `COMPANY_NOT_FOUND`
- `COMPANY_INACTIVE`
- `USER_NOT_FOUND`
- `USER_INACTIVE`
- `USER_NOT_IN_COMPANY`
- `USER_ALREADY_IN_COMPANY`
- `USER_COMPANY_INACTIVE`
- `ROLE_NOT_FOUND`
- `ROLE_CODE_ALREADY_EXISTS`
- `ROLE_NOT_BELONG_TO_COMPANY`
- `SYSTEM_ROLE_CANNOT_BE_MODIFIED`
- `ROLE_IS_IN_USE`
- `PERMISSION_NOT_FOUND`
- `PERMISSION_CODE_ALREADY_EXISTS`
- `ACCESS_DENIED`
- `COMPANY_CONTEXT_REQUIRED`
- `INVALID_EFFECTIVE_TIME`

The existing response wrapper remains compatible and gains a stable error-code field. HTTP mapping:

- 400: invalid request or effective period.
- 401: unauthenticated.
- 403: denied permission or cross-company access.
- 404: missing resource.
- 409: duplicate or resource in use.

The global exception handler no longer exposes internal exception messages. `/auth/me` returns a DTO so password hashes and refresh tokens cannot be serialized.

## 12. Seed Data

Seed modules:

- `IAM`
- `IAM_COMPANY_USER`
- `IAM_COMPANY_ROLE`
- `IAM_PERMISSION`
- `IAM_MODULE`

Seed all requested company-user, company-role, permission, and module permissions. Seed `SUPER_ADMIN` and grant it all active permissions. The sole existing legacy admin is migrated to active membership and assigned this role using lookup criteria, without creating a new user.

## 13. Testing Strategy

### 13.1 Repository and Service

Cover:

- Active membership with permission.
- Membership without permission.
- User outside company.
- Role in company A checked against company B.
- Inactive role.
- Inactive permission.
- Inactive membership.
- Expired assignment.
- Union of permissions from multiple roles.

### 13.2 API Integration

Cover:

- Missing company header.
- Malformed or nonexistent company header.
- User outside selected company.
- User lacking permission.
- Assigning company A role to company B membership.
- Duplicate role code within one company.
- Same role code in different companies.
- Deleting system role.
- Removing membership without deleting user.

### 13.3 Security

Cover:

- Path company and header mismatch.
- Cross-company resource identifiers.
- Backend enforcement independent from frontend visibility.
- Method security enabled and invoked.

Use PostgreSQL Testcontainers for Flyway, JSONB, partial indexes, and integration behavior. H2 may remain only for unaffected legacy tests.

## 14. Verification

Run:

- Gradle clean test.
- Gradle build.
- Flyway migration against an empty PostgreSQL database.
- Flyway migration against a populated schema representing current production data.

Success criteria:

- Existing APIs continue to compile and behave unless explicitly hardened.
- Existing admin obtains `SUPER_ADMIN` through migration.
- Every new IAM write API is protected on the backend.
- Authorization always includes user and company.
- Cross-company IAM access fails.
- Migration is idempotent where repeat-safe SQL is required and does not duplicate memberships.
- Tests and build pass.

## 15. Expected File Changes

The implementation plan will resolve concrete class names after reading neighboring files, while preserving the module boundaries below.

### New files

- Flyway migration files under `backend/bootstrap/src/main/resources/db/migration/`.
- IAM entities and enums in `backend/domain`.
- IAM repositories and projection interfaces in `backend/domain`.
- Membership, role, module, permission, current-user, authorization, audit, and cache services in `backend/application`.
- Request/response DTOs and permission constants in `backend/application`.
- Company-context interface in `application`, request-scoped implementation and filter in `infrastructure`, and permission checker/security wiring in `interfaces`.
- Membership, role, module, permission, and current-user controllers in `backend/interfaces`.
- Repository/service/integration/security tests in corresponding test source sets.

### Modified files

- Backend Gradle configuration to add Flyway and PostgreSQL test support.
- Runtime application configuration for Flyway and Hibernate validation.
- Security configuration to enable method security and install company filtering.
- Existing `User` model to mark legacy company/role fields deprecated while retaining compatibility.
- Existing authentication `/me` response to use a safe DTO.
- Existing exception classes, response wrapper, and global handler for stable error codes/statuses.
- Existing SQL/bootstrap initialization only as necessary to avoid conflicting schema ownership.

## 16. Deferred Work and Known Risks

The following are reported but not broadly changed in this delivery:

- Tenant isolation for legacy transaction, revenue, settlement, driver, and contract modules.
- Driver portal's manual JWT parsing and token-role/type validation.
- Multi-device refresh-token storage and token hashing.
- Migration of browser token storage from localStorage to HttpOnly cookies.
- Database-level tenant enforcement or PostgreSQL row-level security.
- A shared BaseEntity refactor across all legacy entities.
- Redis/Caffeine authorization cache implementation.

The transaction module currently has the highest known cross-tenant risk and should be the first follow-up tenant-isolation project.
