-- Add referrer_id to driver
ALTER TABLE driver ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES "user"(id);

CREATE INDEX IF NOT EXISTS idx_driver_referrer ON driver(referrer_id);

-- Commission config
CREATE TABLE IF NOT EXISTS commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(id),
    driver_id UUID REFERENCES driver(id),
    rate DECIMAL(5,2) NOT NULL,
    note TEXT,
    created_by UUID NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_config_user ON commission_config(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_config_driver ON commission_config(driver_id);

-- Commission log
CREATE TABLE IF NOT EXISTS commission_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES revenue_period(id),
    driver_id UUID NOT NULL REFERENCES driver(id),
    referrer_id UUID NOT NULL REFERENCES "user"(id),
    revenue_amount DECIMAL(15,2) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    original_amount DECIMAL(15,2),
    adjust_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES "user"(id),
    reviewed_at TIMESTAMP,
    reject_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_log_status ON commission_log(status);
CREATE INDEX IF NOT EXISTS idx_commission_log_referrer ON commission_log(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commission_log_period ON commission_log(period_id);

-- User transaction (wallet)
CREATE TABLE IF NOT EXISTS user_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id),
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id UUID,
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    bank_holder VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    processed_by UUID REFERENCES "user"(id),
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    reject_reason TEXT,
    note TEXT,
    created_by UUID NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_transaction_user ON user_transaction(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transaction_status ON user_transaction(status);
CREATE INDEX IF NOT EXISTS idx_user_transaction_type ON user_transaction(transaction_type);

-- Seed navigation menu for Commission
INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, parent.id, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('COMMISSION', 'Hoa hồng', 'Quản lý hoa hồng giới thiệu tài xế', '/commission', 'gift', 1)
) AS values(code, name, description, route, icon, display_order)
LEFT JOIN modules parent ON parent.code = 'MANAGEMENT' AND parent.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = 'COMMISSION' AND m.deleted_at IS NULL);

INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, parent.id, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('USER_WALLET', 'Ví User', 'Quản lý ví và giao dịch user', '/user-wallet', 'wallet', 2)
) AS values(code, name, description, route, icon, display_order)
LEFT JOIN modules parent ON parent.code = 'MANAGEMENT' AND parent.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = 'USER_WALLET' AND m.deleted_at IS NULL);

-- Seed COMMISSION module permissions
INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, p.code, p.name, p.resource, p.action, 'API', 'ACTIVE'
FROM modules m
CROSS JOIN (VALUES
    ('commission.view', 'Xem hoa hồng', 'commission', 'view'),
    ('commission.approve', 'Duyệt hoa hồng', 'commission', 'approve'),
    ('commission.adjust', 'Chỉnh sửa hoa hồng', 'commission', 'adjust'),
    ('commission.config', 'Cấu hình hoa hồng', 'commission', 'config')
) AS p(code, name, resource, action)
WHERE m.code = 'COMMISSION' AND m.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = p.code AND p2.deleted_at IS NULL);

-- Seed USER_WALLET module permissions
INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, p.code, p.name, p.resource, p.action, 'API', 'ACTIVE'
FROM modules m
CROSS JOIN (VALUES
    ('user-wallet.view', 'Xem ví của mình', 'user-wallet', 'view'),
    ('user-wallet.view-all', 'Xem ví tất cả user', 'user-wallet', 'view-all'),
    ('user-wallet.withdraw', 'Tạo yêu cầu rút tiền', 'user-wallet', 'withdraw'),
    ('user-wallet.approve-withdrawal', 'Duyệt rút tiền', 'user-wallet', 'approve-withdrawal'),
    ('user-wallet.mark-paid', 'Đánh dấu đã thanh toán', 'user-wallet', 'mark-paid')
) AS p(code, name, resource, action)
WHERE m.code = 'USER_WALLET' AND m.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = p.code AND p2.deleted_at IS NULL);

-- Grant all new permissions to SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.scope = 'SYSTEM' AND r.deleted_at IS NULL
AND p.code IN ('commission.view', 'commission.approve', 'commission.adjust', 'commission.config',
               'user-wallet.view', 'user-wallet.view-all', 'user-wallet.withdraw',
               'user-wallet.approve-withdrawal', 'user-wallet.mark-paid')
AND p.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);

-- Seed menu-level permissions
INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, 'menu.' || lower(m.code) || '.access', 'Truy cập ' || m.name, lower(m.code), 'access', 'MENU', 'ACTIVE'
FROM modules m
WHERE m.code IN ('COMMISSION', 'USER_WALLET') AND m.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = 'menu.' || lower(m.code) || '.access' AND p2.deleted_at IS NULL);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.scope = 'SYSTEM' AND r.deleted_at IS NULL
AND p.code IN ('menu.commission.access', 'menu.user_wallet.access')
AND p.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
