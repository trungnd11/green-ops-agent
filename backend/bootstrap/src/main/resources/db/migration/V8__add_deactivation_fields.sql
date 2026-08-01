ALTER TABLE "user"
    ADD COLUMN deactivated_reason VARCHAR(255),
    ADD COLUMN deactivated_note TEXT,
    ADD COLUMN deactivated_at  TIMESTAMP;
