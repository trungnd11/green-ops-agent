package com.greenops.agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "commission_log", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"period_id", "driver_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommissionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private RevenuePeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id", nullable = false)
    private User referrer;

    @Column(name = "revenue_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal revenueAmount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal rate;

    @Column(name = "commission_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "original_amount", precision = 15, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "adjust_reason", columnDefinition = "TEXT")
    private String adjustReason;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
