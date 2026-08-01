-- Seed permissions for navigation modules and assign to SUPER_ADMIN

INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, 'menu.' || lower(m.code) || '.access', 'Truy cập ' || m.name, lower(m.code), 'access', 'MENU', 'ACTIVE'
FROM modules m
WHERE m.deleted_at IS NULL AND m.module_type IN ('MODULE', 'FEATURE')
  AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = 'menu.' || lower(m.code) || '.access' AND p2.deleted_at IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.scope = 'SYSTEM' AND r.deleted_at IS NULL
  AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id)
ON CONFLICT (role_id, permission_id) DO NOTHING;
