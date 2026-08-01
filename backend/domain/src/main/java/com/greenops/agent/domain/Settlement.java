package com.greenops.agent.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "settlement", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "period_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RevenuePeriod period;

    @Column(name = "settlement_code", nullable = false, unique = true, length = 50)
    private String settlementCode;

    @Column(name = "total_drivers", nullable = false)
    @Builder.Default
    private Integer totalDrivers = 0;

    @Column(name = "total_revenue", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "total_deduction", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDeduction = BigDecimal.ZERO;

    @Column(name = "total_addition", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAddition = BigDecimal.ZERO;

    @Column(name = "total_payout", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPayout = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "draft";

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
