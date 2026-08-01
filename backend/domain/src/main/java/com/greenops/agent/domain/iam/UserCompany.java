package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.Company;
import com.greenops.agent.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_companies", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "company_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserCompany {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "company_id", nullable = false) private Company company;
    @Column(name = "employee_code", length = 50) private String employeeCode;
    @Column(name = "job_title") private String jobTitle;
    @Column(name = "is_owner", nullable = false) @Builder.Default private boolean owner = false;
    @Column(name = "is_default", nullable = false) @Builder.Default private boolean defaultCompany = false;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private MembershipStatus status = MembershipStatus.ACTIVE;
    @Column(name = "joined_at") private LocalDateTime joinedAt;
    @Column(name = "effective_from") private LocalDateTime effectiveFrom;
    @Column(name = "effective_to") private LocalDateTime effectiveTo;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by") private User createdBy;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "updated_by") private User updatedBy;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;
}
