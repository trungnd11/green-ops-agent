package com.greenops.agent.interfaces.security;

import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ErrorCode;
import com.greenops.agent.application.security.CompanyAccessService;
import com.greenops.agent.application.security.RequestContext;
import com.greenops.agent.domain.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CompanyContextFilter extends OncePerRequestFilter {
    private final RequestContext requestContext;
    private final CompanyAccessService companyAccessService;
    private final HandlerExceptionResolver handlerExceptionResolver;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return SecurityExemptions.skipsCompanyContext(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        try {
            String value = request.getHeader("X-Company-Id");
            if (value == null || value.isBlank()) {
                throw new BusinessException(ErrorCode.COMPANY_CONTEXT_REQUIRED, ErrorCode.COMPANY_CONTEXT_REQUIRED.name());
            }
            UUID companyId;
            try {
                companyId = UUID.fromString(value);
            } catch (IllegalArgumentException ex) {
                throw new BusinessException(ErrorCode.INVALID_ARGUMENT, "X-Company-Id không hợp lệ");
            }
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
                throw new BusinessException(ErrorCode.UNAUTHENTICATED, "Chưa xác thực");
            }
            companyAccessService.validateAccess(user.getId(), companyId);
            requestContext.setCompanyId(companyId);
            chain.doFilter(request, response);
        } catch (BusinessException ex) {
            handlerExceptionResolver.resolveException(request, response, null, ex);
        } finally {
            requestContext.clear();
        }
    }
}
