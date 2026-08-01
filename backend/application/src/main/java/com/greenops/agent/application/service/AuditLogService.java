package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.AuditLogResponse;
import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.domain.iam.AuthorizationAuditLog;
import com.greenops.agent.domain.iam.AuthorizationAuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuthorizationAuditLogRepository repository;

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> list(UUID companyId, int page, int size, String keyword, String actionType, String objectType,
                                               String fromDate, String toDate, UUID entityId) {
        Specification<AuthorizationAuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("action")), pattern),
                        cb.like(cb.lower(root.get("entityType")), pattern),
                        cb.like(cb.lower(root.get("actorUser").get("fullName")), pattern)
                ));
            }
            if (actionType != null && !actionType.isBlank()) {
                predicates.add(cb.equal(root.get("action"), actionType));
            }
            if (objectType != null && !objectType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), objectType));
            }
            if (fromDate != null && !fromDate.isBlank()) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), java.time.LocalDateTime.parse(fromDate + "T00:00:00")));
            }
            if (toDate != null && !toDate.isBlank()) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), java.time.LocalDateTime.parse(toDate + "T23:59:59")));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("actorUser").get("id"), entityId));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuthorizationAuditLog> auditPage = repository.findAll(spec, PageRequest.of(page, size));
        return toPageResponse(auditPage);
    }

    private PageResponse<AuditLogResponse> toPageResponse(Page<AuthorizationAuditLog> page) {
        return PageResponse.<AuditLogResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private AuditLogResponse toResponse(AuthorizationAuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .actorName(log.getActorUser() != null ? log.getActorUser().getFullName() : null)
                .oldData(log.getOldData())
                .newData(log.getNewData())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
