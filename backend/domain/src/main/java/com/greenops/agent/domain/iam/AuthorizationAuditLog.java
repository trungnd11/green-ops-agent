package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "authorization_audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthorizationAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, length = 100) private String action;
    @Column(name = "entity_type", nullable = false, length = 100) private String entityType;
    @Column(name = "entity_id") private UUID entityId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "actor_user_id") private User actorUser;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "company_id") private Company company;
    @Column(name = "old_data", columnDefinition = "jsonb") @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON) private Map<String, Object> oldData;
    @Column(name = "new_data", columnDefinition = "jsonb") @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON) private Map<String, Object> newData;
    @Column(name = "ip_address", length = 45) private String ipAddress;
    @Column(name = "user_agent", columnDefinition = "TEXT") private String userAgent;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
}
