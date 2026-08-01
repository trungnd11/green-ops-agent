package com.greenops.agent.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "\"user\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Deprecated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Company company;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "force_password_change", nullable = false)
    @Builder.Default
    private boolean forcePasswordChange = true;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "deactivated_reason", length = 255)
    private String deactivatedReason;

    @Column(name = "deactivated_note", columnDefinition = "TEXT")
    private String deactivatedNote;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
