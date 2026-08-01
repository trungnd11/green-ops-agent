CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE RESTRICT,
    employee_code VARCHAR(50),
    job_title VARCHAR(255),
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('INVITED','ACTIVE','INACTIVE','REMOVED')),
    joined_at TIMESTAMP,
    effective_from TIMESTAMP,
    effective_to TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_user_companies_user_company UNIQUE (user_id, company_id),
    CONSTRAINT ck_user_companies_effective_time CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from)
);

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES modules(id) ON DELETE RESTRICT,
    module_type VARCHAR(20) NOT NULL CHECK (module_type IN ('GROUP','MODULE','FEATURE')),
    route VARCHAR(255),
    icon VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    deleted_at TIMESTAMP
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
    code VARCHAR(150) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('MENU','PAGE','BUTTON','API','DATA')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    deleted_at TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES company(id) ON DELETE RESTRICT,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('SYSTEM','COMPANY')),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES "user"(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES "user"(id),
    deleted_at TIMESTAMP,
    CONSTRAINT ck_roles_scope_company CHECK ((scope = 'SYSTEM' AND company_id IS NULL) OR (scope = 'COMPANY' AND company_id IS NOT NULL))
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES "user"(id),
    CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE user_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_company_id UUID NOT NULL REFERENCES user_companies(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES "user"(id),
    effective_from TIMESTAMP,
    effective_to TIMESTAMP,
    CONSTRAINT uq_user_company_roles_membership_role UNIQUE (user_company_id, role_id),
    CONSTRAINT ck_user_company_roles_effective_time CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from)
);

CREATE TABLE authorization_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    actor_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    company_id UUID REFERENCES company(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_modules_active_code ON modules (LOWER(code)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_permissions_active_code ON permissions (LOWER(code)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_permissions_active_resource_action ON permissions (module_id, LOWER(resource), LOWER(action)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_roles_system_active_code ON roles (LOWER(code)) WHERE scope = 'SYSTEM' AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_roles_company_active_code ON roles (company_id, LOWER(code)) WHERE scope = 'COMPANY' AND deleted_at IS NULL;
CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);
CREATE INDEX idx_modules_parent ON modules(parent_id);
CREATE INDEX idx_permissions_module ON permissions(module_id);
CREATE INDEX idx_roles_company ON roles(company_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_company_roles_membership ON user_company_roles(user_company_id);
CREATE INDEX idx_user_company_roles_role ON user_company_roles(role_id);
CREATE INDEX idx_authorization_audit_company ON authorization_audit_logs(company_id);
CREATE INDEX idx_authorization_audit_actor ON authorization_audit_logs(actor_user_id);
