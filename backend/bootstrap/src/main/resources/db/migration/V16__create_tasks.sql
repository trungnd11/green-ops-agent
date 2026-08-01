CREATE TABLE IF NOT EXISTS admin_task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    assignee_id UUID REFERENCES "user"(id),
    reference_type VARCHAR(50),
    reference_id UUID,
    due_date DATE,
    created_by UUID NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_task_status ON admin_task(status);
CREATE INDEX IF NOT EXISTS idx_admin_task_assignee ON admin_task(assignee_id);
