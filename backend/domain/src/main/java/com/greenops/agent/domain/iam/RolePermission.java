package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "role_permissions", uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "permission_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RolePermission {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "role_id", nullable = false) private Role role;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "permission_id", nullable = false) private Permission permission;
    @CreationTimestamp @Column(name = "granted_at", nullable = false, updatable = false) private LocalDateTime grantedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "granted_by") private User grantedBy;
}
