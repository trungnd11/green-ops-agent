package com.greenops.agent.interfaces.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;

import java.util.Set;

public final class SecurityExemptions {
    private static final Set<String> PUBLIC_PATHS = Set.of("/auth/login", "/auth/refresh", "/auth/verify-2fa", "/driver/login");
    private static final Set<String> CONTEXT_PATHS = Set.of("/auth/login", "/auth/refresh", "/auth/me", "/auth/verify-2fa", "/driver/login", "/me/companies", "/2fa/status", "/2fa/setup", "/2fa/enable", "/2fa/disable", "/2fa/verify");

    private SecurityExemptions() {
    }

    public static boolean isPublic(HttpServletRequest request) {
        String path = request.getServletPath();
        return HttpMethod.OPTIONS.matches(request.getMethod()) || PUBLIC_PATHS.contains(path) || isPublicPrefix(path);
    }

    public static boolean skipsCompanyContext(HttpServletRequest request) {
        String path = request.getServletPath();
        return HttpMethod.OPTIONS.matches(request.getMethod()) || CONTEXT_PATHS.contains(path) || isPublicPrefix(path) || path.startsWith("/driver/");
    }

    private static boolean isPublicPrefix(String path) {
        return path.startsWith("/public/") || path.startsWith("/swagger-ui/") || path.startsWith("/v3/api-docs/");
    }
}
