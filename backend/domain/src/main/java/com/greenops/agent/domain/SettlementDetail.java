package com.greenops.agent.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "settlement_detail", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"settlement_id", "driver_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SettlementDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Settlement settlement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revenue_detail_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RevenueDetail revenueDetail;

    @Column(name = "gross_revenue", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal grossRevenue = BigDecimal.ZERO;

    @Column(name = "total_deduction", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDeduction = BigDecimal.ZERO;

    @Column(name = "total_addition", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAddition = BigDecimal.ZERO;

    @Column(name = "net_payable", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netPayable = BigDecimal.ZERO;

    @Column(name = "current_deposit", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentDeposit = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
