# IAM Roles — Phase 1 Design Spec

## Overview
Build 4 Role management screens (List, Create, Detail, Edit) with modals following Pencil design (`jzrsC`).

## Screens

### 1. Role List (`/admin/roles`)
- 4 summary cards: Total roles, System roles, Custom roles, Roles in use
- Filter bar: search input + role type dropdown + status dropdown + reset button
- Table columns: Role name, Type, Users, Permissions, Status, Last updated, Actions
- Actions: ellipsis kebab → Edit, Clone, Delete
- Create button leads to `/admin/roles/create`

### 2. Role Create (`/admin/roles/create`)
- Section "Thông tin vai trò": Name, Code, Status, Description fields
- Section "Quyền hạn": Permission matrix with groups, search, select all/deselect all
- Cancel → back to list, Save → POST role + navigate to detail

### 3. Role Detail (`/admin/roles/$roleId`)
- Breadcrumb: Quản trị hệ thống / Vai trò / {name}
- Role header: name + system tag + status badge
- Actions: Clone (opens modal), Edit (navigates to edit)
- Tabs: Tổng quan (default), Quyền hạn, Người dùng, Nhật ký thay đổi
- Clone Modal: name + code + description + copy permissions checkbox
- Delete Blocked Modal: shown when attempting to delete a protected role

### 4. Role Edit (`/admin/roles/$roleId/edit`)
- Same layout as Create but pre-filled
- Warning alert if role has assigned users
- Code field read-only

## Module Structure
```
modules/roles/
  api/
    role.api.ts          — fetchRoles, fetchRole, createRole, updateRole, deleteRole
    role.queries.ts      — React Query options
  forms/
    role-form.schema.ts  — Zod schemas
  pages/
    role-list-page.tsx
    role-create-page.tsx
    role-detail-page.tsx
    role-edit-page.tsx
  routes/
    role-list.tsx
    role-create.tsx
    role-detail.tsx
    role-edit.tsx
```

## Data Flow
- Role API: GET/POST/PUT/DELETE `/roles` and `/roles/{id}`
- Permission data: fetched separately via GET `/permissions` (from backend IAM modules)
- Forms: `@tanstack/react-form` + Zod validation (matching existing user form pattern)
- React Query for caching and invalidation

## Routes (to register in routeTree.gen.ts)
- `/admin/roles` → RoleListPage
- `/admin/roles/create` → RoleCreatePage
- `/admin/roles/$roleId` → RoleDetailPage
- `/admin/roles/$roleId/edit` → RoleEditPage
