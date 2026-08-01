package com.greenops.agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "revenue_detail", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"period_id", "driver_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RevenueDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private RevenuePeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    // Doanh thu gốc
    @Column(name = "total_revenue", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "total_trips", nullable = false)
    @Builder.Default
    private Integer totalTrips = 0;

    // Khấu trừ
    @Column(name = "insurance_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal insuranceFee = BigDecimal.ZERO;

    @Column(name = "non_cash_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal nonCashFee = BigDecimal.ZERO;

    @Column(name = "discount_tax", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountTax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal penalty = BigDecimal.ZERO;

    @Column(name = "other_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal otherCost = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal surcharge = BigDecimal.ZERO;

    // Cộng thêm
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "other_income", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal otherIncome = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal tip = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal promotion = BigDecimal.ZERO;

    @Column(name = "charge_refund", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal chargeRefund = BigDecimal.ZERO;

    // Ví & Số dư
    @Column(name = "xanh_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal xanhBalance = BigDecimal.ZERO;

    @Column(name = "deposit_in", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal depositIn = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal withdrawn = BigDecimal.ZERO;

    @Column(name = "available_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "total_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalBalance = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Tính thu nhập thực tế (earned amount):
     * Tổng doanh thu - khấu trừ + cộng thêm
     */
    public BigDecimal getEarnedAmount() {
        BigDecimal deductions = insuranceFee
            .add(nonCashFee)
            .add(discountTax)
            .add(penalty)
            .add(otherCost)
            .add(surcharge);
        BigDecimal additions = bonus
            .add(otherIncome)
            .add(tip)
            .add(promotion)
            .add(chargeRefund);
        return totalRevenue.subtract(deductions).add(additions);
    }

    /**
     * Tính tổng khấu trừ
     */
    public BigDecimal getTotalDeduction() {
        return insuranceFee
            .add(nonCashFee)
            .add(discountTax)
            .add(penalty)
            .add(otherCost)
            .add(surcharge);
    }

    /**
     * Tính tổng cộng thêm
     */
    public BigDecimal getTotalAddition() {
        return bonus
            .add(otherIncome)
            .add(tip)
            .add(promotion)
            .add(chargeRefund);
    }
}
