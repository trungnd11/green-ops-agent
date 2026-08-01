package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_company_roles", uniqueConstraints = @UniqueConstraint(columnNames = {"user_company_id", "role_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserCompanyRole {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_company_id", nullable = false) private UserCompany userCompany;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "role_id", nullable = false) private Role role;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private Status status = Status.ACTIVE;
    @CreationTimestamp @Column(name = "assigned_at", nullable = false, updatable = false) private LocalDateTime assignedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assigned_by") private User assignedBy;
    @Column(name = "effective_from") private LocalDateTime effectiveFrom;
    @Column(name = "effective_to") private LocalDateTime effectiveTo;
}
