-- ============================================================
-- DATABASE: agent_xanhsm
-- Hệ thống quản lý Agent Xanh SM
-- Trình biên dịch: PostgreSQL 15+
-- ============================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. COMPANY (Công ty Agent)
-- ============================================================
CREATE TABLE company (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(20) NOT NULL UNIQUE,       -- Mã công ty, VD: GREENOPS
    name            VARCHAR(255) NOT NULL,              -- Tên đầy đủ
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    tax_code        VARCHAR(20),                        -- Mã số thuế
    contact_person  VARCHAR(255),                       -- Người liên hệ
    logo_url        TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. DRIVER (Tài xế)
-- ============================================================
CREATE TABLE driver (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    driver_code         VARCHAR(50) NOT NULL,            -- Mã LX từ Xanh SM
    full_name           VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    email               VARCHAR(255),
    cccd                VARCHAR(20),                     -- Số căn cước công dân
    cccd_issue_date     DATE,                            -- Ngày cấp
    cccd_issue_place    VARCHAR(100),                    -- Nơi cấp
    birth_date          DATE,
    gender              VARCHAR(10)
                            CHECK (gender IN ('male', 'female', 'other')),
    address             TEXT,
    license_number      VARCHAR(50),                     -- Số GPLX
    license_class       VARCHAR(10),                     -- Hạng GPLX (B1, B2, C, ...)
    join_date           DATE NOT NULL,                   -- Ngày gia nhập
    resign_date         DATE,                            -- Ngày nghỉ việc
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'suspended', 'resigned')),
    deposit_amount      DECIMAL(15, 2) NOT NULL DEFAULT 0,  -- Tiền cọc
    note                TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Mỗi công ty không được trùng mã LX
    UNIQUE (company_id, driver_code)
);

CREATE INDEX idx_driver_company ON driver(company_id);
CREATE INDEX idx_driver_status ON driver(status);
CREATE INDEX idx_driver_code ON driver(driver_code);
CREATE INDEX idx_driver_phone ON driver(phone);
CREATE INDEX idx_driver_cccd ON driver(cccd);

-- ============================================================
-- 3. "USER" (Người dùng hệ thống) — cần trước vì các bảng khác FK tới
-- ============================================================
CREATE TABLE "user" (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer'
                        CHECK (role IN ('admin', 'manager', 'accountant', 'viewer')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
    last_login      TIMESTAMP,
    refresh_token   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_company ON "user"(company_id);
CREATE INDEX idx_user_role ON "user"(role);

-- ============================================================
-- 4. REVENUE_PERIOD (Kỳ báo cáo doanh thu)
-- ============================================================
CREATE TABLE revenue_period (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    name            VARCHAR(200) NOT NULL,               -- Tên kỳ: "Quý 2/2026"
    type            VARCHAR(20) NOT NULL
                        CHECK (type IN ('daily', 'monthly', 'quarterly', 'yearly')),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    source          VARCHAR(50) NOT NULL DEFAULT 'excel'
                        CHECK (source IN ('excel', 'manual')),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'imported', 'verified', 'closed')),
    note            TEXT,
    created_by      UUID REFERENCES "user"(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Không trùng kỳ trong cùng công ty
    UNIQUE (company_id, start_date, end_date),
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_revenue_period_company ON revenue_period(company_id);
CREATE INDEX idx_revenue_period_status ON revenue_period(status);
CREATE INDEX idx_revenue_period_dates ON revenue_period(start_date, end_date);

-- ============================================================
-- 5. REVENUE_DETAIL (Chi tiết doanh thu tài xế trong kỳ)
-- ============================================================
CREATE TABLE revenue_detail (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id           UUID NOT NULL REFERENCES revenue_period(id) ON DELETE CASCADE,
    driver_id           UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,

    -- Doanh thu gốc
    total_revenue       DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- D: Tổng doanh thu
    total_trips         INTEGER NOT NULL DEFAULT 0,           -- E: Tổng số chuyến

    -- Khấu trừ
    insurance_fee       DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- F: Bảo hiểm
    non_cash_fee        DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- G: Phí GD ko dùng tiền mặt
    discount_tax        DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- H: Chiết khấu + thuế
    penalty             DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- K: Phạt
    other_cost          DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- L: Chi phí khác
    surcharge           DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- S: Phụ phí

    -- Cộng thêm
    bonus               DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- I: Thưởng
    other_income        DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- J: Thu nhập khác
    tip                 DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- Q: Tiền Tip
    promotion           DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- R: Khuyến mại
    charge_refund       DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- X: Hoàn tiền sạc

    -- Ví & số dư
    xanh_balance        DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- M: Số dư app Xanh
    deposit_in          DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- N: Tiền nạp
    withdrawn           DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- O: Đã rút
    available_balance   DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- P: Số dư khả dụng (ví NB)
    total_balance       DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- V: Tổng số dư

    -- Metadata
    note                TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Mỗi tài xế chỉ có 1 bản ghi trong 1 kỳ
    UNIQUE (period_id, driver_id)
);

CREATE INDEX idx_revenue_detail_period ON revenue_detail(period_id);
CREATE INDEX idx_revenue_detail_driver ON revenue_detail(driver_id);
CREATE INDEX idx_revenue_detail_driver_period ON revenue_detail(driver_id, period_id);

-- ============================================================
-- 5. TRANSACTION (Lịch sử giao dịch ví)
-- ============================================================
CREATE TABLE transaction (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id           UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    transaction_code    VARCHAR(50) NOT NULL UNIQUE,      -- Mã giao dịch tự sinh
    transaction_type    VARCHAR(30) NOT NULL
                            CHECK (transaction_type IN (
                                'revenue', 'deduction',
                                'topup', 'withdraw',
                                'bonus', 'penalty',
                                'deposit', 'refund',
                                'adjustment'
                            )),
    amount              DECIMAL(15, 2) NOT NULL,          -- Số dương: +, số âm: -
    balance_before      DECIMAL(15, 2) NOT NULL,
    balance_after       DECIMAL(15, 2) NOT NULL,
    reference_type      VARCHAR(50),                      -- revenue_detail, settlement, ...
    reference_id        UUID,                             -- ID tham chiếu
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    processed_by        UUID REFERENCES "user"(id),
    processed_at        TIMESTAMP,
    reject_reason       TEXT,
    note                TEXT,
    created_by          UUID REFERENCES "user"(id),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_driver ON transaction(driver_id);
CREATE INDEX idx_transaction_type ON transaction(transaction_type);
CREATE INDEX idx_transaction_created ON transaction(created_at);
CREATE INDEX idx_transaction_driver_date ON transaction(driver_id, created_at);

-- ============================================================
-- 6. SETTLEMENT (Bảng quyết toán)
-- ============================================================
CREATE TABLE settlement (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    period_id           UUID NOT NULL REFERENCES revenue_period(id) ON DELETE RESTRICT,
    settlement_code     VARCHAR(50) NOT NULL UNIQUE,      -- Mã quyết toán
    total_drivers       INTEGER NOT NULL DEFAULT 0,
    total_revenue       DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_deduction     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_addition      DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_payout        DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'cancelled')),
    approved_by         UUID REFERENCES "user"(id),
    approved_at         TIMESTAMP,
    note                TEXT,
    created_by          UUID REFERENCES "user"(id),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Một kỳ chỉ có một quyết toán
    UNIQUE (company_id, period_id)
);

CREATE INDEX idx_settlement_company ON settlement(company_id);
CREATE INDEX idx_settlement_status ON settlement(status);
CREATE INDEX idx_settlement_period ON settlement(period_id);

-- ============================================================
-- 7. SETTLEMENT_DETAIL (Chi tiết quyết toán từng tài xế)
-- ============================================================
CREATE TABLE settlement_detail (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id       UUID NOT NULL REFERENCES settlement(id) ON DELETE CASCADE,
    driver_id           UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    revenue_detail_id   UUID REFERENCES revenue_detail(id) ON DELETE SET NULL,

    gross_revenue       DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_deduction     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_addition      DECIMAL(15, 2) NOT NULL DEFAULT 0,
    net_payable         DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_deposit     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    note                TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (settlement_id, driver_id)
);

CREATE INDEX idx_settlement_detail_settlement ON settlement_detail(settlement_id);
CREATE INDEX idx_settlement_detail_driver ON settlement_detail(driver_id);

-- ============================================================
-- 8. CONTRACT (Hợp đồng điện tử)
-- ============================================================
CREATE TABLE contract (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    driver_id           UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    contract_number     VARCHAR(50) NOT NULL UNIQUE,      -- Số hợp đồng
    contract_type       VARCHAR(30) NOT NULL DEFAULT 'cooperation'
                            CHECK (contract_type IN ('cooperation', 'labor', 'service')),
    start_date          DATE NOT NULL,                    -- Ngày hiệu lực
    end_date            DATE,                             -- Ngày hết hạn (null = vô thời hạn)
    signed_date         DATE,                             -- Ngày ký
    expiry_date         DATE,                             -- Ngày hết hạn ký (nếu có)
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                            CHECK (status IN (
                                'draft', 'pending_sign', 'active',
                                'expired', 'terminated', 'cancelled'
                            )),
    file_url            TEXT,                             -- URL file hợp đồng đã ký
    file_original_name  VARCHAR(255),                     -- Tên file gốc
    digital_signature   TEXT,                             -- Chữ ký số (JSON)
    terms               TEXT,                             -- Điều khoản tóm tắt
    commission_rate     DECIMAL(5, 2),                    -- Tỷ lệ chiết khấu (%)

    -- Metadata
    created_by          UUID REFERENCES "user"(id),
    signed_by_company   UUID REFERENCES "user"(id),       -- Người đại diện công ty ký
    signed_at_company   TIMESTAMP,
    signed_by_driver    TIMESTAMP,                        -- Tài xế ký (thời gian)
    signed_driver_info  TEXT,                             -- Thông tin xác thực tài xế (OTP, SMS, ...)
    note                TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_company ON contract(company_id);
CREATE INDEX idx_contract_driver ON contract(driver_id);
CREATE INDEX idx_contract_status ON contract(status);
CREATE INDEX idx_contract_number ON contract(contract_number);

-- ============================================================
-- 9. AUDIT_LOG (Lịch sử hoạt động)
-- ============================================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES "user"(id),
    action          VARCHAR(50) NOT NULL,                 -- CREATE, UPDATE, DELETE, IMPORT, EXPORT, ...
    entity_type     VARCHAR(50) NOT NULL,                 -- driver, revenue_detail, ...
    entity_id       UUID,                                -- ID bản ghi
    old_value       JSONB,                                -- Giá trị cũ
    new_value       JSONB,                                -- Giá trị mới
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Mật khẩu mặc định: admin123 (bcrypt hash)
INSERT INTO company (id, code, name, address, phone, tax_code, status)
VALUES (uuid_generate_v4(), 'GREENOPS', 'GREENOPS TRANSPORT',
        'Hà Nội', '0912345678', '0123456789', 'active');

-- User admin mặc định
-- Password: admin123 (đã hash bcrypt)
INSERT INTO "user" (company_id, username, password_hash, full_name, email, role)
SELECT id, 'admin',
       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
       'Quản trị viên', 'admin@greenops.vn', 'admin'
FROM company WHERE code = 'GREENOPS';
