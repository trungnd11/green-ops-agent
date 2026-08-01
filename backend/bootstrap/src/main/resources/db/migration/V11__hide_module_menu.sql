UPDATE modules SET status = 'INACTIVE' WHERE code = 'IAM_MODULE' AND deleted_at IS NULL;
