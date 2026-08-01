CREATE TABLE IF NOT EXISTS complaint (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES driver(id),
    settlement_id UUID REFERENCES settlement(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'khac',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    evidence JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    response TEXT,
    responded_by UUID REFERENCES "user"(id),
    responded_at TIMESTAMP,
    created_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_driver ON complaint(driver_id);
CREATE INDEX IF NOT EXISTS idx_complaint_status ON complaint(status);
