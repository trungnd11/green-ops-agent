-- Seed full navigation menu tree

-- 1. MAIN section
INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, NULL, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('DASHBOARD',   'Tổng quan',              'Trang tổng quan hệ thống',      '/',            'layout-dashboard', 1),
    ('TASKS',       'Việc cần xử lý',          'Công việc cần xử lý',           '/tasks',        'list-checks',     2)
) AS values(code, name, description, route, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = values.code AND m.deleted_at IS NULL);

-- 2. MANAGEMENT group
INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, NULL, 'GROUP', NULL, 'layout-dashboard', 3, 'ACTIVE'
FROM (VALUES ('MANAGEMENT', 'Quản lý', 'Quản lý tài xế, doanh thu, quyết toán')) AS values(code, name, description)
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = values.code AND m.deleted_at IS NULL);

INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, parent.id, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('DRIVER',     'Tài xế',       'Quản lý tài xế',         '/drivers',       'users',          1),
    ('REVENUE',    'Doanh thu',    'Quản lý doanh thu',       '/revenues',      'trending-up',    2),
    ('SETTLEMENT', 'Quyết toán',   'Quản lý quyết toán',      '/settlements',   'wallet',         3),
    ('REQUEST',    'Nạp/Rút',      'Quản lý nạp tiền và rút tiền', '/requests', 'arrow-up-down',  4),
    ('COMPLAINT',  'Khiếu nại',    'Quản lý khiếu nại',       '/complaints',    'message-square', 5)
) AS values(code, name, description, route, icon, display_order)
JOIN modules parent ON parent.code = 'MANAGEMENT' AND parent.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = values.code AND m.deleted_at IS NULL);

-- 3. IAM group - update existing modules with routes and icons
UPDATE modules SET route = '/admin',     icon = 'users',          name = 'Người dùng'  WHERE code = 'IAM_COMPANY_USER' AND deleted_at IS NULL;
UPDATE modules SET route = '/admin/roles', icon = 'shield',        name = 'Vai trò'      WHERE code = 'IAM_COMPANY_ROLE' AND deleted_at IS NULL;
UPDATE modules SET route = '/admin/permissions', icon = 'shield-check', name = 'Phân quyền'   WHERE code = 'IAM_PERMISSION' AND deleted_at IS NULL;
UPDATE modules SET route = '/admin/modules', icon = 'folder-tree', name = 'Module'      WHERE code = 'IAM_MODULE' AND deleted_at IS NULL;
UPDATE modules SET name = 'Quản trị hệ thống', route = NULL, icon = 'shield' WHERE code = 'IAM' AND deleted_at IS NULL;

-- Add company & audit-log modules under IAM
INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT 'IAM_COMPANY', 'Công ty', 'Quản lý công ty', parent.id, 'MODULE', '/admin/companies', 'building-2', 2, 'ACTIVE'
FROM modules parent WHERE parent.code = 'IAM' AND parent.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = 'IAM_COMPANY' AND m.deleted_at IS NULL);

INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT 'IAM_AUDIT_LOG', 'Nhật ký', 'Nhật ký phân quyền', parent.id, 'MODULE', '/admin/audit-log', 'history', 5, 'ACTIVE'
FROM modules parent WHERE parent.code = 'IAM' AND parent.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = 'IAM_AUDIT_LOG' AND m.deleted_at IS NULL);

-- 4. UTILITIES group
INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, NULL, 'GROUP', NULL, 'layout-dashboard', 4, 'ACTIVE'
FROM (VALUES ('UTILITIES', 'Tiện ích', 'Báo cáo, cấu hình và thông báo')) AS values(code, name, description)
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = values.code AND m.deleted_at IS NULL);

INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, parent.id, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('REPORT',       'Báo cáo',    'Báo cáo và thống kê',          '/reports',       'file-text',    1),
    ('SETTINGS',     'Cấu hình',    'Cấu hình hệ thống',            '/settings',      'settings',     2),
    ('NOTIFICATION', 'Thông báo',   'Quản lý thông báo',            '/notifications',  'bell',         3)
) AS values(code, name, description, route, icon, display_order)
JOIN modules parent ON parent.code = 'UTILITIES' AND parent.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = values.code AND m.deleted_at IS NULL);
