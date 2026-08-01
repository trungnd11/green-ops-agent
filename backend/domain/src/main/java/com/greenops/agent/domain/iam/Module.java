package com.greenops.agent.domain.iam;

import com.greenops.agent.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "modules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Module {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, length = 100) private String code;
    @Column(nullable = false) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "parent_id") private Module parent;
    @Enumerated(EnumType.STRING) @Column(name = "module_type", nullable = false, length = 20) private ModuleType moduleType;
    @Column(length = 255) private String route;
    @Column(length = 100) private String icon;
    @Column(name = "display_order", nullable = false) @Builder.Default private int displayOrder = 0;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private Status status = Status.ACTIVE;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by") private User createdBy;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "updated_by") private User updatedBy;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;
}
