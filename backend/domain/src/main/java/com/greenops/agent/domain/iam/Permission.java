package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Permission {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "module_id", nullable = false) private Module module;
    @Column(nullable = false, length = 150) private String code;
    @Column(nullable = false) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(nullable = false, length = 100) private String resource;
    @Column(nullable = false, length = 100) private String action;
    @Enumerated(EnumType.STRING) @Column(name = "permission_type", nullable = false, length = 20) private PermissionType permissionType;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private Status status = Status.ACTIVE;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by") private User createdBy;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "updated_by") private User updatedBy;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;
}
