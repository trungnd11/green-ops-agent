package com.greenops.agent.application.security;

import java.util.UUID;

public interface RequestContext {
    void setCompanyId(UUID companyId);
    UUID getCompanyId();
    void clear();
}
