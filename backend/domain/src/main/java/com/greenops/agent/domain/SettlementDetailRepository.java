package com.greenops.agent.domain;

import com.greenops.agent.domain.SettlementDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementDetailRepository extends JpaRepository<SettlementDetail, UUID> {

    List<SettlementDetail> findBySettlementId(UUID settlementId);

    List<SettlementDetail> findBySettlementIdAndDriverId(UUID settlementId, UUID driverId);
}
