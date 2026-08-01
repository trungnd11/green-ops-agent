INSERT INTO modules (code, name, description, parent_id, module_type, display_order, status)
VALUES ('IAM', 'Quản trị hệ thống', 'Quản lý định danh và phân quyền', NULL, 'GROUP', 1, 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO modules (code, name, parent_id, module_type, display_order, status)
SELECT values.code, values.name, parent.id, 'MODULE', values.display_order, 'ACTIVE'
FROM (VALUES
    ('IAM_COMPANY_USER', 'Quản lý thành viên công ty', 1),
    ('IAM_COMPANY_ROLE', 'Quản lý vai trò công ty', 2),
    ('IAM_PERMISSION', 'Quản lý quyền', 3),
    ('IAM_MODULE', 'Quản lý module', 4)
) AS values(code, name, display_order)
JOIN modules parent ON parent.code = 'IAM' AND parent.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT module.id, values.code, values.name, values.resource, values.action, 'API', 'ACTIVE'
FROM (VALUES
    ('IAM_COMPANY_USER','iam.company-user.list','Xem danh sách thành viên','company-user','list'),
    ('IAM_COMPANY_USER','iam.company-user.view','Xem thành viên','company-user','view'),
    ('IAM_COMPANY_USER','iam.company-user.create','Thêm thành viên','company-user','create'),
    ('IAM_COMPANY_USER','iam.company-user.update','Cập nhật thành viên','company-user','update'),
    ('IAM_COMPANY_USER','iam.company-user.remove','Gỡ thành viên','company-user','remove'),
    ('IAM_COMPANY_USER','iam.company-user.assign-role','Gán vai trò','company-user','assign-role'),
    ('IAM_COMPANY_ROLE','iam.company-role.list','Xem danh sách vai trò','company-role','list'),
    ('IAM_COMPANY_ROLE','iam.company-role.view','Xem vai trò','company-role','view'),
    ('IAM_COMPANY_ROLE','iam.company-role.create','Tạo vai trò','company-role','create'),
    ('IAM_COMPANY_ROLE','iam.company-role.update','Cập nhật vai trò','company-role','update'),
    ('IAM_COMPANY_ROLE','iam.company-role.delete','Xóa vai trò','company-role','delete'),
    ('IAM_COMPANY_ROLE','iam.company-role.assign-permission','Gán quyền','company-role','assign-permission'),
    ('IAM_PERMISSION','iam.permission.list','Xem danh sách quyền','permission','list'),
    ('IAM_PERMISSION','iam.permission.view','Xem quyền','permission','view'),
    ('IAM_PERMISSION','iam.permission.create','Tạo quyền','permission','create'),
    ('IAM_PERMISSION','iam.permission.update','Cập nhật quyền','permission','update'),
    ('IAM_PERMISSION','iam.permission.delete','Xóa quyền','permission','delete'),
    ('IAM_MODULE','iam.module.list','Xem module','module','list'),
    ('IAM_MODULE','iam.module.create','Tạo module','module','create'),
    ('IAM_MODULE','iam.module.update','Cập nhật module','module','update'),
    ('IAM_MODULE','iam.module.delete','Xóa module','module','delete')
) AS values(module_code, code, name, resource, action)
JOIN modules module ON module.code = values.module_code AND module.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO roles (code, name, description, scope, is_system, status)
VALUES ('SUPER_ADMIN', 'Super Administrator', 'Quản trị toàn bộ nền tảng', 'SYSTEM', TRUE, 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'SUPER_ADMIN'
  AND role.scope = 'SYSTEM'
  AND role.deleted_at IS NULL
  AND permission.status = 'ACTIVE'
  AND permission.deleted_at IS NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO user_companies (user_id, company_id, is_default, status, joined_at, effective_from)
SELECT id, company_id, TRUE, 'ACTIVE', created_at, created_at
FROM "user"
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM "user"
    WHERE LOWER(role) = 'admin' AND LOWER(status) = 'active';

    IF admin_count > 1 THEN
        RAISE EXCEPTION 'Expected at most one active legacy admin, found %', admin_count;
    END IF;
END $$;

INSERT INTO user_company_roles (user_company_id, role_id, status, effective_from)
SELECT membership.id, role.id, 'ACTIVE', NOW()
FROM "user" legacy_user
JOIN user_companies membership
  ON membership.user_id = legacy_user.id
 AND membership.company_id = legacy_user.company_id
JOIN roles role
  ON role.code = 'SUPER_ADMIN'
 AND role.scope = 'SYSTEM'
 AND role.deleted_at IS NULL
WHERE LOWER(legacy_user.role) = 'admin'
  AND LOWER(legacy_user.status) = 'active'
ON CONFLICT (user_company_id, role_id) DO NOTHING;
