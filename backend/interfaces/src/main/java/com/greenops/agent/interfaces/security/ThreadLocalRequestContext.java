package com.greenops.agent.interfaces.security;

import com.greenops.agent.application.security.CurrentCompanyProvider;
import com.greenops.agent.application.security.RequestContext;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class ThreadLocalRequestContext implements RequestContext, CurrentCompanyProvider {
    private final ThreadLocal<UUID> companyId = new ThreadLocal<>();

    public void setCompanyId(UUID companyId) {
        this.companyId.set(companyId);
    }

    public UUID getCompanyId() {
        return companyId.get();
    }

    public Optional<UUID> getCurrentCompanyId() {
        return Optional.ofNullable(companyId.get());
    }

    public void clear() {
        companyId.remove();
    }
}
