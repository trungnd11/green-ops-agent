CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    tax_code VARCHAR(20),
    contact_person VARCHAR(255),
    logo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE driver (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    driver_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    cccd VARCHAR(20),
    cccd_issue_date DATE,
    cccd_issue_place VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    license_number VARCHAR(50),
    license_class VARCHAR(10),
    join_date DATE NOT NULL,
    resign_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'resigned')),
    deposit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, driver_code)
);
CREATE INDEX idx_driver_company ON driver(company_id);
CREATE INDEX idx_driver_status ON driver(status);
CREATE INDEX idx_driver_code ON driver(driver_code);
CREATE INDEX idx_driver_phone ON driver(phone);
CREATE INDEX idx_driver_cccd ON driver(cccd);

CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'accountant', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP,
    refresh_token TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_company ON "user"(company_id);
CREATE INDEX idx_user_role ON "user"(role);

CREATE TABLE revenue_period (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'excel' CHECK (source IN ('excel', 'manual')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'imported', 'verified', 'closed')),
    note TEXT,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, start_date, end_date),
    CHECK (end_date >= start_date)
);
CREATE INDEX idx_revenue_period_company ON revenue_period(company_id);
CREATE INDEX idx_revenue_period_status ON revenue_period(status);
CREATE INDEX idx_revenue_period_dates ON revenue_period(start_date, end_date);

CREATE TABLE revenue_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES revenue_period(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    total_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_trips INTEGER NOT NULL DEFAULT 0,
    insurance_fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
    non_cash_fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    penalty DECIMAL(15, 2) NOT NULL DEFAULT 0,
    other_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    surcharge DECIMAL(15, 2) NOT NULL DEFAULT 0,
    bonus DECIMAL(15, 2) NOT NULL DEFAULT 0,
    other_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tip DECIMAL(15, 2) NOT NULL DEFAULT 0,
    promotion DECIMAL(15, 2) NOT NULL DEFAULT 0,
    charge_refund DECIMAL(15, 2) NOT NULL DEFAULT 0,
    xanh_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    deposit_in DECIMAL(15, 2) NOT NULL DEFAULT 0,
    withdrawn DECIMAL(15, 2) NOT NULL DEFAULT 0,
    available_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, driver_id)
);
CREATE INDEX idx_revenue_detail_period ON revenue_detail(period_id);
CREATE INDEX idx_revenue_detail_driver ON revenue_detail(driver_id);
CREATE INDEX idx_revenue_detail_driver_period ON revenue_detail(driver_id, period_id);

CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('revenue', 'deduction', 'topup', 'withdraw', 'bonus', 'penalty', 'deposit', 'refund', 'adjustment')),
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    processed_by UUID REFERENCES "user"(id),
    processed_at TIMESTAMP,
    reject_reason TEXT,
    note TEXT,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transaction_driver ON transaction(driver_id);
CREATE INDEX idx_transaction_type ON transaction(transaction_type);
CREATE INDEX idx_transaction_created ON transaction(created_at);
CREATE INDEX idx_transaction_driver_date ON transaction(driver_id, created_at);

CREATE TABLE settlement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    period_id UUID NOT NULL REFERENCES revenue_period(id) ON DELETE RESTRICT,
    settlement_code VARCHAR(50) NOT NULL UNIQUE,
    total_drivers INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_deduction DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_addition DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_payout DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'cancelled')),
    approved_by UUID REFERENCES "user"(id),
    approved_at TIMESTAMP,
    note TEXT,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, period_id)
);
CREATE INDEX idx_settlement_company ON settlement(company_id);
CREATE INDEX idx_settlement_status ON settlement(status);
CREATE INDEX idx_settlement_period ON settlement(period_id);

CREATE TABLE settlement_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlement(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    revenue_detail_id UUID REFERENCES revenue_detail(id) ON DELETE SET NULL,
    gross_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_deduction DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_addition DECIMAL(15, 2) NOT NULL DEFAULT 0,
    net_payable DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_deposit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (settlement_id, driver_id)
);
CREATE INDEX idx_settlement_detail_settlement ON settlement_detail(settlement_id);
CREATE INDEX idx_settlement_detail_driver ON settlement_detail(driver_id);

CREATE TABLE contract (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES driver(id) ON DELETE RESTRICT,
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    contract_type VARCHAR(30) NOT NULL DEFAULT 'cooperation' CHECK (contract_type IN ('cooperation', 'labor', 'service')),
    start_date DATE NOT NULL,
    end_date DATE,
    signed_date DATE,
    expiry_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_sign', 'active', 'expired', 'terminated', 'cancelled')),
    file_url TEXT,
    file_original_name VARCHAR(255),
    digital_signature TEXT,
    terms TEXT,
    commission_rate DECIMAL(5, 2),
    created_by UUID REFERENCES "user"(id),
    signed_by_company UUID REFERENCES "user"(id),
    signed_at_company TIMESTAMP,
    signed_by_driver TIMESTAMP,
    signed_driver_info TEXT,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contract_company ON contract(company_id);
CREATE INDEX idx_contract_driver ON contract(driver_id);
CREATE INDEX idx_contract_status ON contract(status);
CREATE INDEX idx_contract_number ON contract(contract_number);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "user"(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
