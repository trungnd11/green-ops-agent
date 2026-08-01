package com.greenops.agent.interfaces.iam;

import com.greenops.agent.application.security.AuditMetadataProvider;
import com.greenops.agent.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HttpAuditMetadataProvider implements AuditMetadataProvider {
    private final HttpServletRequest request;

    @Override
    public AuditMetadata current() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        var actorId = authentication != null && authentication.getPrincipal() instanceof User user ? user.getId() : null;
        return new AuditMetadata(actorId, request.getRemoteAddr(), request.getHeader("User-Agent"));
    }
}
