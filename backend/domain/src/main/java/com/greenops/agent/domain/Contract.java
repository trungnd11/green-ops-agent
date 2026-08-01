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
@Table(name = "contract")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "contract_number", nullable = false, unique = true, length = 50)
    private String contractNumber;

    @Column(name = "contract_type", nullable = false, length = 30)
    @Builder.Default
    private String contractType = "cooperation";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "signed_date")
    private LocalDate signedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "draft";

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "file_original_name", length = 255)
    private String fileOriginalName;

    @Column(name = "digital_signature", columnDefinition = "TEXT")
    private String digitalSignature;

    @Column(columnDefinition = "TEXT")
    private String terms;

    @Column(name = "commission_rate", precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "signed_by_company")
    private UUID signedByCompany;

    @Column(name = "signed_at_company")
    private LocalDateTime signedAtCompany;

    @Column(name = "signed_by_driver")
    private LocalDateTime signedByDriver;

    @Column(name = "signed_driver_info", columnDefinition = "TEXT")
    private String signedDriverInfo;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
