package com.greenops.agent.domain;

import com.greenops.agent.domain.RevenueDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevenueDetailRepository extends JpaRepository<RevenueDetail, UUID> {

    Optional<RevenueDetail> findByPeriodIdAndDriverId(UUID periodId, UUID driverId);

    boolean existsByPeriodIdAndDriverId(UUID periodId, UUID driverId);

    Page<RevenueDetail> findByPeriodId(UUID periodId, Pageable pageable);

    List<RevenueDetail> findByPeriodId(UUID periodId);

    List<RevenueDetail> findByPeriodIdAndDriverIdIn(UUID periodId, List<UUID> driverIds);

    @Query("SELECT COUNT(rd) FROM RevenueDetail rd WHERE rd.period.id = :periodId")
    long countByPeriodId(@Param("periodId") UUID periodId);

    @Query("SELECT COALESCE(SUM(rd.totalRevenue), 0) FROM RevenueDetail rd WHERE rd.period.id = :periodId")
    BigDecimal sumTotalRevenueByPeriodId(@Param("periodId") UUID periodId);

    @Query("SELECT COALESCE(SUM(rd.insuranceFee + rd.nonCashFee + rd.discountTax + " +
           "rd.penalty + rd.otherCost + rd.surcharge), 0) FROM RevenueDetail rd " +
           "WHERE rd.period.id = :periodId")
    BigDecimal sumTotalDeductionByPeriodId(@Param("periodId") UUID periodId);

    @Query("SELECT COALESCE(SUM(rd.bonus + rd.otherIncome + rd.tip + " +
           "rd.promotion + rd.chargeRefund), 0) FROM RevenueDetail rd " +
           "WHERE rd.period.id = :periodId")
    BigDecimal sumTotalAdditionByPeriodId(@Param("periodId") UUID periodId);

    void deleteByPeriodId(UUID periodId);
}
