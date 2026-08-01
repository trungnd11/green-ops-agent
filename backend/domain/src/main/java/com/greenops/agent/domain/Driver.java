package com.greenops.agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "driver_code"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "driver_code", nullable = false, length = 50)
    private String driverCode;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String cccd;

    @Column(name = "cccd_issue_date")
    private LocalDate cccdIssueDate;

    @Column(name = "cccd_issue_place", length = 100)
    private String cccdIssuePlace;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 10)
    private String gender;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "license_class", length = 10)
    private String licenseClass;

    @Column(name = "join_date", nullable = false)
    private LocalDate joinDate;

    @Column(name = "resign_date")
    private LocalDate resignDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @Column(name = "deposit_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id")
    private User referrer;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
