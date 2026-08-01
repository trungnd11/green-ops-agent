CREATE OR REPLACE FUNCTION protect_system_role()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.is_system THEN
        RAISE EXCEPTION 'system role cannot be deleted' USING ERRCODE = '23514', CONSTRAINT = 'ck_roles_system_immutable';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.is_system AND (
        NEW.code IS DISTINCT FROM OLD.code OR
        NEW.is_system IS DISTINCT FROM OLD.is_system OR
        NEW.scope IS DISTINCT FROM OLD.scope OR
        NEW.company_id IS DISTINCT FROM OLD.company_id OR
        NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    ) THEN
        RAISE EXCEPTION 'system role identity cannot be changed' USING ERRCODE = '23514', CONSTRAINT = 'ck_roles_system_immutable';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_protect_system ON roles;
CREATE TRIGGER trg_roles_protect_system
BEFORE UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION protect_system_role();
