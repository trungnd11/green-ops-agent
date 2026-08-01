# Referral & Commission System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống cho phép User giới thiệu tài xế và nhận hoa hồng theo doanh thu, với ví User và cơ chế duyệt/rút tiền.

**Architecture:** Backend Spring Boot 3.2 (3 lớp domain/application/interfaces) + Frontend React 19 admin app. Thêm bảng mới qua Flyway migration. Module frontend theo pattern modules/commission và modules/user-wallet.

**Tech Stack:** Java 17, Spring Boot 3.2, PostgreSQL 15+, Flyway, React 19, TanStack Router, TanStack Query, @xanh/ui, Tailwind CSS 4

## Global Constraints

- Tất cả message tiếng Việt (có dấu)
- UUID PK dùng `GenerationType.UUID`
- DECIMAL(15,2) cho tiền, DECIMAL(5,2) cho tỷ lệ %
- HTTP response wrap trong `ApiResponse<T>`
- Route tree đăng ký thủ công trong `routeTree.gen.ts`
- Menu sidebar load từ API `/me/menu` — seed qua Flyway
- Format code theo Prettier config có sẵn (single quote, trailing comma)
- Backend package: `com.greenops.agent`

---

### Task 1: Database Migration (V12)

**Files:**
- Create: `backend/bootstrap/src/main/resources/db/migration/V12__create_referral_commission.sql`

**Interfaces:**
- Produces: Bảng `commission_config`, `commission_log`, `user_transaction` + cột `referrer_id` trên `driver`

- [ ] **Step 1: Viết migration V12**

```sql
-- Add referrer_id to driver
ALTER TABLE driver ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES "user"(id);

CREATE INDEX idx_driver_referrer ON driver(referrer_id);

-- Commission config
CREATE TABLE commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(id),
    driver_id UUID REFERENCES driver(id),
    rate DECIMAL(5,2) NOT NULL,
    note TEXT,
    created_by UUID NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_config_user ON commission_config(user_id);
CREATE INDEX idx_commission_config_driver ON commission_config(driver_id);

-- Commission log
CREATE TABLE commission_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES revenue_period(id),
    driver_id UUID NOT NULL REFERENCES driver(id),
    referrer_id UUID NOT NULL REFERENCES "user"(id),
    revenue_amount DECIMAL(15,2) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    original_amount DECIMAL(15,2),
    adjust_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES "user"(id),
    reviewed_at TIMESTAMP,
    reject_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (period_id, driver_id)
);

CREATE INDEX idx_commission_log_status ON commission_log(status);
CREATE INDEX idx_commission_log_referrer ON commission_log(referrer_id);
CREATE INDEX idx_commission_log_period ON commission_log(period_id);

-- User transaction (wallet)
CREATE TABLE user_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id),
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id UUID,
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    bank_holder VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    processed_by UUID REFERENCES "user"(id),
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    reject_reason TEXT,
    note TEXT,
    created_by UUID NOT NULL REFERENCES "user"(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_transaction_user ON user_transaction(user_id);
CREATE INDEX idx_user_transaction_status ON user_transaction(status);
CREATE INDEX idx_user_transaction_type ON user_transaction(transaction_type);

-- Seed navigation menu for Commission
INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, parent.id, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('COMMISSION', 'Hoa hồng', 'Quản lý hoa hồng giới thiệu tài xế', '/commission', 'gift', 1)
) AS values(code, name, description, route, icon, display_order)
LEFT JOIN modules parent ON parent.code = 'MANAGEMENT' AND parent.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = 'COMMISSION' AND m.deleted_at IS NULL);

INSERT INTO modules (code, name, description, parent_id, module_type, route, icon, display_order, status)
SELECT values.code, values.name, values.description, parent.id, 'MODULE', values.route, values.icon, values.display_order, 'ACTIVE'
FROM (VALUES
    ('USER_WALLET', 'Ví User', 'Quản lý ví và giao dịch user', '/user-wallet', 'wallet', 2)
) AS values(code, name, description, route, icon, display_order)
LEFT JOIN modules parent ON parent.code = 'MANAGEMENT' AND parent.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM modules m WHERE m.code = 'USER_WALLET' AND m.deleted_at IS NULL);

-- Seed COMMISSION module permissions
INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, p.code, p.name, p.resource, p.action, 'API', 'ACTIVE'
FROM modules m
CROSS JOIN (VALUES
    ('commission.view', 'Xem hoa hồng', 'commission', 'view'),
    ('commission.approve', 'Duyệt hoa hồng', 'commission', 'approve'),
    ('commission.adjust', 'Chỉnh sửa hoa hồng', 'commission', 'adjust'),
    ('commission.config', 'Cấu hình hoa hồng', 'commission', 'config')
) AS p(code, name, resource, action)
WHERE m.code = 'COMMISSION' AND m.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = p.code AND p2.deleted_at IS NULL);

-- Seed USER_WALLET module permissions
INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, p.code, p.name, p.resource, p.action, 'API', 'ACTIVE'
FROM modules m
CROSS JOIN (VALUES
    ('user-wallet.view', 'Xem ví của mình', 'user-wallet', 'view'),
    ('user-wallet.view-all', 'Xem ví tất cả user', 'user-wallet', 'view-all'),
    ('user-wallet.withdraw', 'Tạo yêu cầu rút tiền', 'user-wallet', 'withdraw'),
    ('user-wallet.approve-withdrawal', 'Duyệt rút tiền', 'user-wallet', 'approve-withdrawal'),
    ('user-wallet.mark-paid', 'Đánh dấu đã thanh toán', 'user-wallet', 'mark-paid')
) AS p(code, name, resource, action)
WHERE m.code = 'USER_WALLET' AND m.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = p.code AND p2.deleted_at IS NULL);

-- Grant all new permissions to SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.scope = 'SYSTEM' AND r.deleted_at IS NULL
AND p.code IN ('commission.view', 'commission.approve', 'commission.adjust', 'commission.config',
               'user-wallet.view', 'user-wallet.view-all', 'user-wallet.withdraw',
               'user-wallet.approve-withdrawal', 'user-wallet.mark-paid')
AND p.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);

-- Seed menu-level permissions
INSERT INTO permissions (module_id, code, name, resource, action, permission_type, status)
SELECT m.id, 'menu.' || lower(m.code) || '.access', 'Truy cập ' || m.name, lower(m.code), 'access', 'MENU', 'ACTIVE'
FROM modules m
WHERE m.code IN ('COMMISSION', 'USER_WALLET') AND m.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM permissions p2 WHERE p2.code = 'menu.' || lower(m.code) || '.access' AND p2.deleted_at IS NULL);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND r.scope = 'SYSTEM' AND r.deleted_at IS NULL
AND p.code IN ('menu.commission.access', 'menu.user_wallet.access')
AND p.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
```

- [ ] **Step 2: Chạy thử migration**

Run: `cd backend && ./gradlew flywayMigrate -Dspring.flyway.locations=classpath:db/migration`

Expected: BUILD SUCCESSFUL, 5 new tables/indexes created.

- [ ] **Step 3: Commit**

```bash
git add backend/bootstrap/src/main/resources/db/migration/V12__create_referral_commission.sql
git commit -m "feat(db): add referral commission tables V12"
```

---

### Task 2: Backend Domain Entities & Repositories

**Files:**
- Create: `backend/domain/src/main/java/com/greenops/agent/domain/CommissionConfig.java`
- Create: `backend/domain/src/main/java/com/greenops/agent/domain/CommissionLog.java`
- Create: `backend/domain/src/main/java/com/greenops/agent/domain/UserTransaction.java`
- Create: `backend/domain/src/main/java/com/greenops/agent/domain/CommissionConfigRepository.java`
- Create: `backend/domain/src/main/java/com/greenops/agent/domain/CommissionLogRepository.java`
- Create: `backend/domain/src/main/java/com/greenops/agent/domain/UserTransactionRepository.java`
- Modify: `backend/domain/src/main/java/com/greenops/agent/domain/Driver.java`

**Interfaces:**
- Produces: 3 JPA entities + 3 repositories + modified Driver entity

- [ ] **Step 1: Tạo CommissionConfig entity**

```java
package com.greenops.agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "commission_config")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CommissionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal rate;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 2: Tạo CommissionLog entity**

```java
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
```

- [ ] **Step 3: Tạo UserTransaction entity**

```java
package com.greenops.agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_transaction")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "transaction_code", nullable = false, length = 50, unique = true)
    private String transactionCode;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_before", nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Column(name = "bank_holder", length = 100)
    private String bankHolder;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Tạo 3 Repository interfaces**

CommissionConfigRepository.java:
```java
package com.greenops.agent.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionConfigRepository extends JpaRepository<CommissionConfig, UUID> {

    @Query("SELECT c FROM CommissionConfig c WHERE c.driver.id = :driverId AND c.user.id = :userId")
    Optional<CommissionConfig> findByDriverIdAndUserId(@Param("driverId") UUID driverId, @Param("userId") UUID userId);

    @Query("SELECT c FROM CommissionConfig c WHERE c.driver.id = :driverId")
    Optional<CommissionConfig> findByDriverId(@Param("driverId") UUID driverId);

    @Query("SELECT c FROM CommissionConfig c WHERE c.user.id = :userId AND c.driver IS NULL")
    Optional<CommissionConfig> findByUserIdOnly(@Param("userId") UUID userId);

    @Query("SELECT c FROM CommissionConfig c WHERE c.user IS NULL AND c.driver IS NULL")
    Optional<CommissionConfig> findGlobal();
}
```

CommissionLogRepository.java:
```java
package com.greenops.agent.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionLogRepository extends JpaRepository<CommissionLog, UUID> {

    Optional<CommissionLog> findByPeriodIdAndDriverId(UUID periodId, UUID driverId);

    Page<CommissionLog> findByPeriodIdAndStatus(UUID periodId, String status, Pageable pageable);

    Page<CommissionLog> findByStatus(String status, Pageable pageable);

    @Query("SELECT c FROM CommissionLog c WHERE c.status = :status AND c.createdAt >= :from AND c.createdAt < :to")
    Page<CommissionLog> findByStatusAndDateRange(
            @Param("status") String status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    List<CommissionLog> findByReferrerIdAndStatus(UUID referrerId, String status);
}
```

UserTransactionRepository.java:
```java
package com.greenops.agent.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface UserTransactionRepository extends JpaRepository<UserTransaction, UUID> {

    Page<UserTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<UserTransaction> findByStatus(String status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.transactionType = 'commission' AND t.status = 'APPROVED' THEN t.amount ELSE 0 END), 0) - " +
           "COALESCE(SUM(CASE WHEN t.transactionType = 'withdrawal' AND t.status = 'APPROVED' THEN -t.amount ELSE 0 END), 0) " +
           "FROM UserTransaction t WHERE t.user.id = :userId")
    BigDecimal calculateAvailableBalance(@Param("userId") UUID userId);
}
```

- [ ] **Step 5: Sửa Driver entity thêm referrerId**

```java
    // Thêm sau field note (dòng 81)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id")
    private User referrer;
```

- [ ] **Step 6: Build để verify**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
git add backend/domain/src/main/java/com/greenops/agent/domain/CommissionConfig.java
git add backend/domain/src/main/java/com/greenops/agent/domain/CommissionLog.java
git add backend/domain/src/main/java/com/greenops/agent/domain/UserTransaction.java
git add backend/domain/src/main/java/com/greenops/agent/domain/CommissionConfigRepository.java
git add backend/domain/src/main/java/com/greenops/agent/domain/CommissionLogRepository.java
git add backend/domain/src/main/java/com/greenops/agent/domain/UserTransactionRepository.java
git add backend/domain/src/main/java/com/greenops/agent/domain/Driver.java
git commit -m "feat(domain): add commission and user transaction entities"
```

---

### Task 3: Backend DTOs

**Files:**
- Create: `backend/application/src/main/java/com/greenops/agent/application/dto/CommissionLogResponse.java`
- Create: `backend/application/src/main/java/com/greenops/agent/application/dto/CommissionConfigRequest.java`
- Create: `backend/application/src/main/java/com/greenops/agent/application/dto/CommissionReviewRequest.java`
- Create: `backend/application/src/main/java/com/greenops/agent/application/dto/UserTransactionResponse.java`
- Create: `backend/application/src/main/java/com/greenops/agent/application/dto/UserWithdrawRequest.java`
- Create: `backend/application/src/main/java/com/greenops/agent/application/dto/UserBalanceResponse.java`
- Modify: `backend/application/src/main/java/com/greenops/agent/application/dto/DriverRequest.java` — thêm referrerId

- [ ] **Step 1: Tạo CommissionLogResponse**

```java
package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionLogResponse {
    private UUID id;
    private UUID periodId;
    private String periodName;
    private UUID driverId;
    private String driverCode;
    private String driverName;
    private UUID referrerId;
    private String referrerName;
    private BigDecimal revenueAmount;
    private BigDecimal rate;
    private BigDecimal commissionAmount;
    private BigDecimal originalAmount;
    private String adjustReason;
    private String status;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String rejectReason;
    private LocalDateTime createdAt;
}
```

- [ ] **Step 2: Tạo CommissionConfigRequest**

```java
package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionConfigRequest {
    private UUID userId;
    private UUID driverId;
    private BigDecimal rate;
    private String note;
}
```

- [ ] **Step 3: Tạo CommissionReviewRequest**

```java
package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionReviewRequest {
    private String action;
    private BigDecimal adjustedAmount;
    private String reason;
}
```

- [ ] **Step 4: Tạo UserTransactionResponse**

```java
package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTransactionResponse {
    private UUID id;
    private UUID userId;
    private String userName;
    private String transactionCode;
    private String transactionType;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String bankName;
    private String bankAccount;
    private String bankHolder;
    private String status;
    private String rejectReason;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private LocalDateTime paidAt;
}
```

- [ ] **Step 5: Tạo UserWithdrawRequest**

```java
package com.greenops.agent.application.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWithdrawRequest {
    @Positive
    private BigDecimal amount;
    private String bankName;
    private String bankAccount;
    private String bankHolder;
    private String note;
}
```

- [ ] **Step 6: Tạo UserBalanceResponse**

```java
package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBalanceResponse {
    private UUID userId;
    private String userName;
    private BigDecimal availableBalance;
}
```

- [ ] **Step 7: Sửa DriverRequest thêm referrerId**

Thêm field vào class:
```java
    private UUID referrerId;
```

- [ ] **Step 8: Build để verify**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 9: Commit**

```bash
git add backend/application/src/main/java/com/greenops/agent/application/dto/CommissionLogResponse.java
git add backend/application/src/main/java/com/greenops/agent/application/dto/CommissionConfigRequest.java
git add backend/application/src/main/java/com/greenops/agent/application/dto/CommissionReviewRequest.java
git add backend/application/src/main/java/com/greenops/agent/application/dto/UserTransactionResponse.java
git add backend/application/src/main/java/com/greenops/agent/application/dto/UserWithdrawRequest.java
git add backend/application/src/main/java/com/greenops/agent/application/dto/UserBalanceResponse.java
git add backend/application/src/main/java/com/greenops/agent/application/dto/DriverRequest.java
git commit -m "feat(dto): add commission and user wallet DTOs"
```

---

### Task 4: Backend Services

**Files:**
- Create: `backend/application/src/main/java/com/greenops/agent/application/service/CommissionService.java`
- Create: `backend/application/src/main/java/com/greenops/agent/application/service/UserWalletService.java`

- [ ] **Step 1: Tạo CommissionService**

```java
package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.*;
import com.greenops.agent.domain.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionService {

    private final CommissionLogRepository commissionLogRepository;
    private final CommissionConfigRepository commissionConfigRepository;
    private final RevenuePeriodRepository revenuePeriodRepository;
    private final RevenueDetailRepository revenueDetailRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final UserTransactionRepository userTransactionRepository;

    public PageResponse<CommissionLogResponse> getPendingCommissions(UUID periodId, String status, Pageable pageable) {
        Page<CommissionLog> page;
        if (periodId != null) {
            page = commissionLogRepository.findByPeriodIdAndStatus(periodId, status, pageable);
        } else {
            page = commissionLogRepository.findByStatus(status, pageable);
        }
        return PageResponse.<CommissionLogResponse>builder()
                .items(page.getContent().stream().map(this::toCommissionLogResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional
    public void calculateCommissions(UUID periodId) {
        RevenuePeriod period = revenuePeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ doanh thu", periodId));

        if (!"daily".equals(period.getType())) {
            throw new BusinessException("Chỉ hỗ trợ tính hoa hồng cho kỳ doanh thu hàng ngày");
        }
        var revenueDetails = revenueDetailRepository.findByPeriodId(periodId);
        for (var detail : revenueDetails) {
            Driver driver = detail.getDriver();
            if (driver.getReferrer() == null) continue;

            if (commissionLogRepository.findByPeriodIdAndDriverId(periodId, driver.getId()).isPresent()) continue;

            BigDecimal rate = resolveCommissionRate(driver.getReferrer().getId(), driver.getId());
            if (rate == null) continue;

            BigDecimal commission = detail.getTotalRevenue().multiply(rate).divide(BigDecimal.valueOf(100));

            CommissionLog log = CommissionLog.builder()
                    .period(period)
                    .driver(driver)
                    .referrer(driver.getReferrer())
                    .revenueAmount(detail.getTotalRevenue())
                    .rate(rate)
                    .commissionAmount(commission)
                    .status("PENDING")
                    .build();
            commissionLogRepository.save(log);
        }
    }

    private BigDecimal resolveCommissionRate(UUID userId, UUID driverId) {
        var byDriver = commissionConfigRepository.findByDriverId(driverId);
        if (byDriver.isPresent()) return byDriver.get().getRate();
        var byUser = commissionConfigRepository.findByUserIdOnly(userId);
        if (byUser.isPresent()) return byUser.get().getRate();
        var global = commissionConfigRepository.findGlobal();
        if (global.isPresent()) return global.get().getRate();
        return null;
    }

    @Transactional
    public void reviewCommission(UUID commissionId, CommissionReviewRequest request, UUID reviewerId) {
        CommissionLog log = commissionLogRepository.findById(commissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Hoa hồng", commissionId));

        if (!"PENDING".equals(log.getStatus())) {
            throw new BusinessException("Hoa hồng đã được xử lý trước đó");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", reviewerId));

        switch (request.getAction()) {
            case "approve" -> approveCommission(log, reviewer);
            case "adjust" -> adjustAndApprove(log, request, reviewer);
            case "reject" -> rejectCommission(log, request, reviewer);
            default -> throw new BusinessException("Hành động không hợp lệ: " + request.getAction());
        }
    }

    private void approveCommission(CommissionLog log, User reviewer) {
        log.setStatus("APPROVED");
        log.setReviewedBy(reviewer);
        log.setReviewedAt(LocalDateTime.now());
        commissionLogRepository.save(log);
        createCommissionTransaction(log);
    }

    private void adjustAndApprove(CommissionLog log, CommissionReviewRequest request, User reviewer) {
        if (request.getAdjustedAmount() == null || request.getAdjustedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền hoa hồng không hợp lệ");
        }
        log.setOriginalAmount(log.getCommissionAmount());
        log.setCommissionAmount(request.getAdjustedAmount());
        log.setAdjustReason(request.getReason());
        log.setStatus("APPROVED");
        log.setReviewedBy(reviewer);
        log.setReviewedAt(LocalDateTime.now());
        commissionLogRepository.save(log);
        createCommissionTransaction(log);
    }

    private void rejectCommission(CommissionLog log, CommissionReviewRequest request, User reviewer) {
        log.setStatus("REJECTED");
        log.setReviewedBy(reviewer);
        log.setReviewedAt(LocalDateTime.now());
        log.setRejectReason(request.getReason());
        commissionLogRepository.save(log);
    }

    private void createCommissionTransaction(CommissionLog log) {
        BigDecimal balanceBefore = userTransactionRepository.calculateAvailableBalance(log.getReferrer().getId());
        if (balanceBefore == null) balanceBefore = BigDecimal.ZERO;

        String txCode = "CM" + System.currentTimeMillis();

        UserTransaction tx = UserTransaction.builder()
                .user(log.getReferrer())
                .transactionCode(txCode)
                .transactionType("commission")
                .amount(log.getCommissionAmount())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceBefore.add(log.getCommissionAmount()))
                .referenceType("commission")
                .referenceId(log.getId())
                .status("APPROVED")
                .createdBy(log.getReferrer())
                .build();
        userTransactionRepository.save(tx);
    }

    private CommissionLogResponse toCommissionLogResponse(CommissionLog log) {
        return CommissionLogResponse.builder()
                .id(log.getId())
                .periodId(log.getPeriod().getId())
                .periodName(log.getPeriod().getName())
                .driverId(log.getDriver().getId())
                .driverCode(log.getDriver().getDriverCode())
                .driverName(log.getDriver().getFullName())
                .referrerId(log.getReferrer().getId())
                .referrerName(log.getReferrer().getFullName())
                .revenueAmount(log.getRevenueAmount())
                .rate(log.getRate())
                .commissionAmount(log.getCommissionAmount())
                .originalAmount(log.getOriginalAmount())
                .adjustReason(log.getAdjustReason())
                .status(log.getStatus())
                .reviewedByName(log.getReviewedBy() != null ? log.getReviewedBy().getFullName() : null)
                .reviewedAt(log.getReviewedAt())
                .rejectReason(log.getRejectReason())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
```

- [ ] **Step 2: Tạo UserWalletService**

```java
package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.domain.*;
import com.greenops.agent.domain.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserWalletService {

    private final UserTransactionRepository userTransactionRepository;
    private final UserRepository userRepository;

    public UserBalanceResponse getBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));
        BigDecimal balance = userTransactionRepository.calculateAvailableBalance(userId);
        if (balance == null) balance = BigDecimal.ZERO;
        return UserBalanceResponse.builder()
                .userId(userId)
                .userName(user.getFullName())
                .availableBalance(balance)
                .build();
    }

    public PageResponse<UserTransactionResponse> getTransactions(UUID userId, Pageable pageable) {
        Page<UserTransaction> page = userTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return toPageResponse(page);
    }

    public PageResponse<UserTransactionResponse> getPendingWithdrawals(Pageable pageable) {
        Page<UserTransaction> page = userTransactionRepository.findByStatus("PENDING", pageable);
        return toPageResponse(page);
    }

    @Transactional
    public UserTransactionResponse requestWithdraw(UUID userId, UserWithdrawRequest request, UUID createdBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        BigDecimal balance = userTransactionRepository.calculateAvailableBalance(userId);
        if (balance == null) balance = BigDecimal.ZERO;

        if (request.getAmount().compareTo(balance) > 0) {
            throw new BusinessException("Số dư không đủ để rút");
        }

        String txCode = "WD" + System.currentTimeMillis();

        UserTransaction tx = UserTransaction.builder()
                .user(user)
                .transactionCode(txCode)
                .transactionType("withdrawal")
                .amount(request.getAmount().negate())
                .balanceBefore(balance)
                .balanceAfter(balance.subtract(request.getAmount()))
                .bankName(request.getBankName())
                .bankAccount(request.getBankAccount())
                .bankHolder(request.getBankHolder())
                .status("PENDING")
                .note(request.getNote())
                .createdBy(userRepository.findById(createdBy)
                        .orElseThrow(() -> new ResourceNotFoundException("Người dùng", createdBy)))
                .build();
        userTransactionRepository.save(tx);
        return toResponse(tx);
    }

    @Transactional
    public void approveWithdrawal(UUID transactionId, UUID adminId) {
        UserTransaction tx = userTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch", transactionId));

        if (!"PENDING".equals(tx.getStatus()) || !"withdrawal".equals(tx.getTransactionType())) {
            throw new BusinessException("Giao dịch không hợp lệ hoặc đã được xử lý");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", adminId));

        tx.setStatus("APPROVED");
        tx.setProcessedBy(admin);
        tx.setProcessedAt(LocalDateTime.now());
        userTransactionRepository.save(tx);
    }

    @Transactional
    public void rejectWithdrawal(UUID transactionId, UUID adminId, String reason) {
        UserTransaction tx = userTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch", transactionId));

        if (!"PENDING".equals(tx.getStatus())) {
            throw new BusinessException("Giao dịch đã được xử lý");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", adminId));

        tx.setStatus("REJECTED");
        tx.setProcessedBy(admin);
        tx.setProcessedAt(LocalDateTime.now());
        tx.setRejectReason(reason);
        userTransactionRepository.save(tx);
    }

    private PageResponse<UserTransactionResponse> toPageResponse(Page<UserTransaction> page) {
        return PageResponse.<UserTransactionResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private UserTransactionResponse toResponse(UserTransaction tx) {
        return UserTransactionResponse.builder()
                .id(tx.getId())
                .userId(tx.getUser().getId())
                .userName(tx.getUser().getFullName())
                .transactionCode(tx.getTransactionCode())
                .transactionType(tx.getTransactionType())
                .amount(tx.getAmount())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .bankName(tx.getBankName())
                .bankAccount(tx.getBankAccount())
                .bankHolder(tx.getBankHolder())
                .status(tx.getStatus())
                .rejectReason(tx.getRejectReason())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .processedAt(tx.getProcessedAt())
                .paidAt(tx.getPaidAt())
                .build();
    }
}
```

- [ ] **Step 3: Build để verify**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/application/src/main/java/com/greenops/agent/application/service/CommissionService.java
git add backend/application/src/main/java/com/greenops/agent/application/service/UserWalletService.java
git commit -m "feat(service): add commission and user wallet services"
```

---

### Task 5: Backend Controllers

**Files:**
- Create: `backend/interfaces/src/main/java/com/greenops/agent/interfaces/controller/CommissionController.java`
- Create: `backend/interfaces/src/main/java/com/greenops/agent/interfaces/controller/UserWalletController.java`

- [ ] **Step 1: Tạo CommissionController**

```java
package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.service.CommissionService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/commissions")
@RequiredArgsConstructor
public class CommissionController {

    private final CommissionService commissionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CommissionLogResponse>>> getCommissions(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID periodId,
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(commissionService.getPendingCommissions(periodId, status, pageable)));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<Void>> reviewCommission(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody CommissionReviewRequest request) {
        commissionService.reviewCommission(id, request, user.getId());
        String msg = switch (request.getAction()) {
            case "approve" -> "Duyệt hoa hồng thành công";
            case "adjust" -> "Đã chỉnh sửa và duyệt hoa hồng";
            case "reject" -> "Đã từ chối hoa hồng";
            default -> "Thành công";
        };
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }

    @PostMapping("/calculate/{periodId}")
    public ResponseEntity<ApiResponse<Void>> calculateCommissions(
            @AuthenticationPrincipal User user,
            @PathVariable UUID periodId) {
        commissionService.calculateCommissions(periodId);
        return ResponseEntity.ok(ApiResponse.ok("Tính hoa hồng thành công", null));
    }
}
```

- [ ] **Step 2: Tạo UserWalletController**

```java
package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.service.UserWalletService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/user-wallet")
@RequiredArgsConstructor
public class UserWalletController {

    private final UserWalletService userWalletService;

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<UserBalanceResponse>> getBalance(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(userWalletService.getBalance(user.getId())));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PageResponse<UserTransactionResponse>>> getTransactions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(userWalletService.getTransactions(user.getId(), pageable)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<UserTransactionResponse>> requestWithdraw(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserWithdrawRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Yêu cầu rút tiền đã được gửi",
                userWalletService.requestWithdraw(user.getId(), request, user.getId())));
    }

    @GetMapping("/withdrawals/pending")
    public ResponseEntity<ApiResponse<PageResponse<UserTransactionResponse>>> getPendingWithdrawals(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return ResponseEntity.ok(ApiResponse.ok(userWalletService.getPendingWithdrawals(pageable)));
    }

    @PostMapping("/withdrawals/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveWithdrawal(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        userWalletService.approveWithdrawal(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Duyệt rút tiền thành công", null));
    }

    @PostMapping("/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectWithdrawal(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        userWalletService.rejectWithdrawal(id, user.getId(), body.getOrDefault("reason", ""));
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối rút tiền", null));
    }
}
```

- [ ] **Step 3: Build để verify**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/interfaces/src/main/java/com/greenops/agent/interfaces/controller/CommissionController.java
git add backend/interfaces/src/main/java/com/greenops/agent/interfaces/controller/UserWalletController.java
git commit -m "feat(api): add commission and user wallet controllers"
```

---

### Task 6: Frontend Shared Types + Icons

**Files:**
- Create: `frontend/packages/shared-types/src/commission.types.ts`
- Create: `frontend/packages/shared-types/src/user-transaction.types.ts`
- Modify: `frontend/packages/shared-types/src/index.ts`
- Modify: `frontend/apps/admin/src/layouts/admin-layout.tsx` — add icon mappings

- [ ] **Step 1: Tạo commission.types.ts**

```ts
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommissionLog {
  id: string;
  periodId: string;
  periodName: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  referrerId: string;
  referrerName: string;
  revenueAmount: number;
  rate: number;
  commissionAmount: number;
  originalAmount?: number;
  adjustReason?: string;
  status: CommissionStatus;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface CommissionConfig {
  id?: string;
  userId?: string;
  driverId?: string;
  rate: number;
  note?: string;
}

export interface CommissionReviewRequest {
  action: 'approve' | 'adjust' | 'reject';
  adjustedAmount?: number;
  reason?: string;
}
```

- [ ] **Step 2: Tạo user-transaction.types.ts**

```ts
export type UserTransactionType = 'commission' | 'withdrawal' | 'adjustment';
export type UserTransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface UserTransaction {
  id: string;
  userId: string;
  transactionCode: string;
  transactionType: UserTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  status: UserTransactionStatus;
  rejectReason?: string;
  note?: string;
  createdAt: string;
  processedAt?: string;
  paidAt?: string;
}

export interface UserBalance {
  userId: string;
  userName: string;
  availableBalance: number;
}

export interface UserWithdrawRequest {
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  note?: string;
}
```

- [ ] **Step 3: Export từ index.ts**

Thêm vào `frontend/packages/shared-types/src/index.ts`:
```ts
export * from './commission.types';
export * from './user-transaction.types';
```

- [ ] **Step 4: Thêm icon mapping trong admin-layout.tsx**

```tsx
// Thêm vào iconMap (sau dòng 'users': Users,)
gift: Gift,
wallet: Wallet,
// Import Gift, Wallet từ lucide-react
```

- [ ] **Step 5: Build frontend**

Run: `cd frontend && pnpm lint`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/packages/shared-types/src/commission.types.ts
git add frontend/packages/shared-types/src/user-transaction.types.ts
git add frontend/packages/shared-types/src/index.ts
git add frontend/apps/admin/src/layouts/admin-layout.tsx
git commit -m "feat(types): add commission and user transaction shared types"
```

---

### Task 7: Frontend Commission Module — API layer

**Files:**
- Create: `frontend/apps/admin/src/modules/commission/api/commission.types.ts`
- Create: `frontend/apps/admin/src/modules/commission/api/commission.api.ts`
- Create: `frontend/apps/admin/src/modules/commission/api/commission.queries.ts`
- Create: `frontend/apps/admin/src/modules/commission/constants/query/commission.ts`

- [ ] **Step 1: Tạo commission.types.ts**

```ts
import type { CommissionLog, CommissionConfig, CommissionReviewRequest } from '@xanh/shared-types';

export type { CommissionLog, CommissionConfig, CommissionReviewRequest };

export interface CommissionSearchParams {
  periodId?: string;
  status?: string;
  page?: number;
  size?: number;
}
```

- [ ] **Step 2: Tạo commission.api.ts**

```ts
import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { CommissionLog, CommissionConfig, CommissionReviewRequest, CommissionSearchParams } from "./commission.types";

export type { CommissionLog, CommissionConfig, CommissionSearchParams };

export async function fetchCommissions(params: CommissionSearchParams = {}): Promise<LegacyPageResponse<CommissionLog>> {
  const queryParams: Record<string, unknown> = {};
  if (params.periodId !== undefined) queryParams.periodId = params.periodId;
  if (params.status !== undefined) queryParams.status = params.status;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.size !== undefined) queryParams.size = params.size;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<CommissionLog>>>("/commissions", queryParams);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách hoa hồng");
  return res.data;
}

export async function reviewCommission(id: string, request: CommissionReviewRequest): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/commissions/${id}/review`, request);
  if (!res.success) throw new Error(res.message || "Xử lý hoa hồng thất bại");
}
```

- [ ] **Step 3: Tạo commission.queries.ts**

```ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCommissions, reviewCommission } from "./commission.api";
import type { CommissionSearchParams } from "./commission.types";

export const commissionKeys = {
  all: ["commissions"] as const,
  list: (params: CommissionSearchParams = {}) => [...commissionKeys.all, "list", params] as const,
};

export const commissionQueries = {
  list: (params: CommissionSearchParams = {}) =>
    queryOptions({
      queryKey: commissionKeys.list(params),
      queryFn: () => fetchCommissions(params),
    }),
};

export function useReviewCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CommissionReviewRequest }) => reviewCommission(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.all });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/admin/src/modules/commission/
git commit -m "feat(admin): add commission API layer"
```

---

### Task 8: Frontend Commission Review Page

**Files:**
- Create: `frontend/apps/admin/src/modules/commission/pages/commission-review-page.tsx`
- Create: `frontend/apps/admin/src/modules/commission/routes/commission-review.tsx`
- Create: `frontend/apps/admin/src/modules/commission/index.ts`
- Modify: `frontend/apps/admin/src/routeTree.gen.ts`

- [ ] **Step 1: Tạo page**

```tsx
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Table, Tag, Modal, Input, Select } from "@xanh/ui";
import { Eye, Check, X, Pencil } from "lucide-react";
import { commissionQueries, useReviewCommission } from "../api/commission.queries";
import type { CommissionLog, CommissionReviewRequest } from "../api/commission.types";
import { formatCurrency, formatDate } from "@xanh/utils";

export function CommissionReviewPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/commission" });
  const [page, setPage] = useState(search.page || 0);
  const [status, setStatus] = useState(search.status || "PENDING");
  const [selected, setSelected] = useState<CommissionLog | null>(null);
  const [modalType, setModalType] = useState<"adjust" | "reject" | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery(commissionQueries.list({ page, status }));
  const reviewMutation = useReviewCommission();

  const handleReview = (id: string, action: CommissionReviewRequest) => {
    reviewMutation.mutate({ id, request: action });
  };

  const handleAdjust = () => {
    if (!selected) return;
    handleReview(selected.id, { action: "adjust", adjustedAmount: Number(adjustAmount) * 1000, reason });
    setModalType(null);
    setSelected(null);
  };

  const handleReject = () => {
    if (!selected) return;
    handleReview(selected.id, { action: "reject", reason });
    setModalType(null);
    setSelected(null);
  };

  const pendingCount = data?.totalElements || 0;
  const totalCommission = data?.items?.reduce((sum, item) => sum + item.commissionAmount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Duyệt hoa hồng</h1>
          <p className="text-sm text-text-tertiary">
            {data?.items?.length ? `${pendingCount} khoản chờ duyệt — Tổng: ${formatCurrency(totalCommission)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            options={[
              { label: "Chờ duyệt", value: "PENDING" },
              { label: "Đã duyệt", value: "APPROVED" },
              { label: "Đã từ chối", value: "REJECTED" },
            ]}
          />
        </div>
      </div>

      <Card>
        <Table
          dataSource={data?.items || []}
          columns={[
            { key: "driverName", title: "Tài xế", render: (_, r) => <span>{r.driverCode} - {r.driverName}</span> },
            { key: "referrerName", title: "User giới thiệu" },
            { key: "revenueAmount", title: "Doanh thu", render: (v) => formatCurrency(v) },
            { key: "commissionAmount", title: "Hoa hồng", render: (v, r) => (
              <span>
                {formatCurrency(v)}
                {r.originalAmount && <span className="text-xs text-text-tertiary ml-1">(đã sửa từ {formatCurrency(r.originalAmount)})</span>}
                <span className="text-xs text-text-tertiary ml-1">({r.rate}%)</span>
              </span>
            )},
            { key: "status", title: "Trạng thái", render: (v) => (
              <Tag color={v === "APPROVED" ? "green" : v === "REJECTED" ? "red" : "yellow"}>{STATUS_LABELS[v]}</Tag>
            )},
            { key: "actions", title: "", render: (_, r) => r.status === "PENDING" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => handleReview(r.id, { action: "approve" })}>
                  <Check className="h-4 w-4" /> Duyệt
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelected(r); setModalType("adjust"); setAdjustAmount(String(r.commissionAmount / 1000)); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { setSelected(r); setModalType("reject"); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : null },
          ]}
          pagination={{
            current: page + 1,
            total: data?.totalElements || 0,
            pageSize: data?.size || 20,
            onChange: (p) => setPage(p - 1),
          }}
        />
      </Card>

      <Modal
        open={modalType === "adjust"}
        onClose={() => setModalType(null)}
        title="Chỉnh sửa hoa hồng"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary">Tài xế: {selected?.driverCode} - {selected?.driverName}</p>
            <p className="text-sm text-text-secondary">User: {selected?.referrerName}</p>
            <p className="text-sm text-text-secondary">Doanh thu: {formatCurrency(selected?.revenueAmount || 0)}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Hoa hồng (nghìn ₫)</label>
            <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Lý do</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do chỉnh sửa" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalType(null)}>Hủy</Button>
            <Button variant="primary" onClick={handleAdjust}>Lưu và duyệt</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalType === "reject"}
        onClose={() => setModalType(null)}
        title="Từ chối hoa hồng"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Từ chối hoa hồng của {selected?.driverName}?</p>
          <div>
            <label className="text-sm font-medium">Lý do</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do từ chối" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalType(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleReject}>Từ chối</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};
```

- [ ] **Step 2: Tạo route**

```tsx
import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { CommissionReviewPage } from "../pages/commission-review-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/commission",
  component: CommissionReviewPage,
});
```

- [ ] **Step 3: Tạo index.ts barrel**

```ts
export { CommissionReviewPage } from "./pages/commission-review-page";
```

- [ ] **Step 4: Đăng ký route trong routeTree.gen.ts**

```ts
// Thêm import
import { Route as AuthenticatedCommissionRoute } from "./modules/commission/routes/commission-review";

// Thêm vào AuthenticatedRoute.addChildren([...])
AuthenticatedCommissionRoute,
```

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/admin/src/modules/commission/
git add frontend/apps/admin/src/routeTree.gen.ts
git commit -m "feat(admin): add commission review page"
```

---

### Task 9: Frontend User Wallet Page

**Files:**
- Create: `frontend/apps/admin/src/modules/user-wallet/api/user-wallet.types.ts`
- Create: `frontend/apps/admin/src/modules/user-wallet/api/user-wallet.api.ts`
- Create: `frontend/apps/admin/src/modules/user-wallet/api/user-wallet.queries.ts`
- Create: `frontend/apps/admin/src/modules/user-wallet/pages/user-wallet-page.tsx`
- Create: `frontend/apps/admin/src/modules/user-wallet/routes/user-wallet.tsx`
- Create: `frontend/apps/admin/src/modules/user-wallet/index.ts`

- [ ] **Step 1: Tạo user-wallet.types.ts**

```ts
import type { UserTransaction, UserBalance, UserWithdrawRequest } from '@xanh/shared-types';
export type { UserTransaction, UserBalance, UserWithdrawRequest };

export interface TransactionSearchParams {
  page?: number;
  size?: number;
}
```

- [ ] **Step 2: Tạo user-wallet.api.ts**

```ts
import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { UserBalance, UserTransaction, UserWithdrawRequest } from "./user-wallet.types";

export async function fetchBalance(): Promise<UserBalance> {
  const res = await httpClient.get<ApiResponse<UserBalance>>("/user-wallet/balance");
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải số dư");
  return res.data;
}

export async function fetchTransactions(page = 0, size = 20): Promise<LegacyPageResponse<UserTransaction>> {
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<UserTransaction>>>("/user-wallet/transactions", { page, size });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải lịch sử giao dịch");
  return res.data;
}

export async function requestWithdraw(data: UserWithdrawRequest): Promise<UserTransaction> {
  const res = await httpClient.post<ApiResponse<UserTransaction>>("/user-wallet/withdraw", data);
  if (!res.success || !res.data) throw new Error(res.message || "Gửi yêu cầu rút tiền thất bại");
  return res.data;
}
```

- [ ] **Step 3: Tạo user-wallet.queries.ts**

```ts
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBalance, fetchTransactions, requestWithdraw } from "./user-wallet.api";

export const walletKeys = {
  all: ["user-wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: (page: number) => [...walletKeys.all, "transactions", page] as const,
};

export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: fetchBalance,
  });
}

export function useWalletTransactions(page = 0) {
  return useQuery({
    queryKey: walletKeys.transactions(page),
    queryFn: () => fetchTransactions(page),
  });
}

export function useRequestWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestWithdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
```

- [ ] **Step 4: Tạo user-wallet-page.tsx**

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Table, Tag, Modal, Input } from "@xanh/ui";
import { Wallet, ArrowUpRight, History } from "lucide-react";
import { useWalletBalance, useWalletTransactions, useRequestWithdraw } from "../api/user-wallet.queries";
import { formatCurrency, formatDate } from "@xanh/utils";

export function UserWalletPage() {
  const [page, setPage] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(page);
  const withdrawMutation = useRequestWithdraw();

  const handleWithdraw = () => {
    withdrawMutation.mutate({
      amount: Number(amount) * 1000,
      bankName,
      bankAccount,
      bankHolder,
    }, {
      onSuccess: () => {
        setShowWithdraw(false);
        setAmount("");
        setBankName("");
        setBankAccount("");
        setBankHolder("");
      },
    });
  };

  const txTypeLabel: Record<string, string> = {
    commission: "Hoa hồng",
    withdrawal: "Rút tiền",
    adjustment: "Điều chỉnh",
  };

  const statusColor: Record<string, string> = {
    PENDING: "yellow",
    APPROVED: "green",
    REJECTED: "red",
    PAID: "blue",
  };

  const statusLabel: Record<string, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    PAID: "Đã thanh toán",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Ví User</h1>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Số dư khả dụng</p>
            <p className="text-3xl font-bold text-brand-teal">
              {balanceLoading ? "..." : formatCurrency(balance?.availableBalance || 0)}
            </p>
            {balance && <p className="text-sm text-text-tertiary mt-1">{balance.userName}</p>}
          </div>
          <Button variant="primary" onClick={() => setShowWithdraw(true)}>
            <ArrowUpRight className="h-4 w-4" /> Rút tiền
          </Button>
        </div>
      </Card>

      <Card title="Lịch sử giao dịch">
        <Table
          dataSource={transactions?.items || []}
          columns={[
            { key: "createdAt", title: "Ngày", render: (v) => formatDate(v) },
            { key: "transactionType", title: "Loại", render: (v) => txTypeLabel[v] || v },
            { key: "amount", title: "Số tiền", render: (v) => (
              <span className={v > 0 ? "text-green-600" : "text-red-500"}>{v > 0 ? "+" : ""}{formatCurrency(v)}</span>
            )},
            { key: "balanceAfter", title: "Số dư sau", render: (v) => formatCurrency(v) },
            { key: "status", title: "Trạng thái", render: (v) => <Tag color={statusColor[v]}>{statusLabel[v]}</Tag> },
            { key: "note", title: "Ghi chú" },
          ]}
          pagination={{
            current: page + 1,
            total: transactions?.totalElements || 0,
            pageSize: transactions?.size || 20,
            onChange: (p) => setPage(p - 1),
          }}
        />
      </Card>

      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Rút tiền">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Số dư hiện tại: {formatCurrency(balance?.availableBalance || 0)}</p>
          <div>
            <label className="text-sm font-medium">Số tiền (nghìn ₫)</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nhập số tiền" />
          </div>
          <div>
            <label className="text-sm font-medium">Ngân hàng</label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-sm font-medium">Số tài khoản</label>
            <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="VD: 1012345678" />
          </div>
          <div>
            <label className="text-sm font-medium">Chủ tài khoản</label>
            <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="VD: NGUYEN VAN A" />
          </div>
          {withdrawMutation.isError && (
            <p className="text-sm text-red-500">{(withdrawMutation.error as Error).message}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleWithdraw} loading={withdrawMutation.isPending}>Gửi yêu cầu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 5: Tạo route**

```tsx
import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { UserWalletPage } from "../pages/user-wallet-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/user-wallet",
  component: UserWalletPage,
});
```

- [ ] **Step 6: Tạo index.ts**

```ts
export { UserWalletPage } from "./pages/user-wallet-page";
```

- [ ] **Step 7: Đăng ký route trong routeTree.gen.ts**

```ts
import { Route as AuthenticatedUserWalletRoute } from "./modules/user-wallet/routes/user-wallet";
// Thêm vào addChildren: AuthenticatedUserWalletRoute,
```

- [ ] **Step 8: Commit**

```bash
git add frontend/apps/admin/src/modules/user-wallet/
git add frontend/apps/admin/src/routeTree.gen.ts
git commit -m "feat(admin): add user wallet page"
```

---

### Task 10: Frontend Withdrawal Review Page

**Files:**
- Create: `frontend/apps/admin/src/modules/user-wallet/pages/withdrawal-review-page.tsx`
- Create: `frontend/apps/admin/src/modules/user-wallet/routes/withdrawal-review.tsx`

- [ ] **Step 1: Tạo API methods (thêm vào user-wallet.api.ts)**

```ts
export async function fetchPendingWithdrawals(page = 0, size = 20): Promise<LegacyPageResponse<UserTransaction>> {
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<UserTransaction>>>("/user-wallet/withdrawals/pending", { page, size });
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách");
  return res.data;
}

export async function approveWithdrawal(id: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/user-wallet/withdrawals/${id}/approve`);
  if (!res.success) throw new Error(res.message || "Duyệt thất bại");
}

export async function rejectWithdrawal(id: string, reason: string): Promise<void> {
  const res = await httpClient.post<ApiResponse<void>>(`/user-wallet/withdrawals/${id}/reject`, { reason });
  if (!res.success) throw new Error(res.message || "Từ chối thất bại");
}
```

- [ ] **Step 2: Tạo withdrawal-review-page.tsx**

```tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Table, Tag, Modal, Input } from "@xanh/ui";
import { Check, X } from "lucide-react";
import { fetchPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from "../api/user-wallet.api";
import { walletKeys } from "../api/user-wallet.queries";
import { formatCurrency, formatDate } from "@xanh/utils";

export function WithdrawalReviewPage() {
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...walletKeys.all, "pending-withdrawals", page],
    queryFn: () => fetchPendingWithdrawals(page),
  });

  const approveMut = useMutation({
    mutationFn: approveWithdrawal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.all }),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectWithdrawal(selectedId!, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      setSelectedId(null);
      setRejectReason("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Duyệt rút tiền</h1>
      </div>

      <Card>
        <Table
          dataSource={data?.items || []}
          columns={[
            { key: "createdAt", title: "Ngày", render: (v) => formatDate(v) },
            { key: "userName", title: "User" },
            { key: "amount", title: "Số tiền", render: (v) => formatCurrency(Math.abs(v)) },
            { key: "bankInfo", title: "Tài khoản", render: (_, r) => `${r.bankName} - ${r.bankAccount} (${r.bankHolder})` },
            { key: "note", title: "Ghi chú" },
            { key: "actions", title: "", render: (_, r) => (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => approveMut.mutate(r.id)} loading={approveMut.isPending}>
                  <Check className="h-4 w-4" /> Duyệt
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { setSelectedId(r.id); }}>
                  <X className="h-4 w-4" /> Từ chối
                </Button>
              </div>
            )},
          ]}
          pagination={{
            current: page + 1,
            total: data?.totalElements || 0,
            pageSize: data?.size || 20,
            onChange: (p) => setPage(p - 1),
          }}
        />
      </Card>

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Từ chối rút tiền">
        <div className="space-y-4">
          <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối" />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedId(null)}>Hủy</Button>
            <Button variant="danger" onClick={() => rejectMut.mutate()} loading={rejectMut.isPending}>Từ chối</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Tạo route**

```tsx
import { createRoute } from "@tanstack/react-router";
import { Route as authenticatedRoute } from "../../../routes/_authenticated";
import { WithdrawalReviewPage } from "../pages/withdrawal-review-page";

export const Route = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/user-wallet/withdrawals",
  component: WithdrawalReviewPage,
});
```

- [ ] **Step 4: Đăng ký route trong routeTree.gen.ts**

```ts
import { Route as AuthenticatedUserWalletWithdrawalsRoute } from "./modules/user-wallet/routes/withdrawal-review";
// Thêm vào addChildren: AuthenticatedUserWalletWithdrawalsRoute,
```

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/admin/src/modules/user-wallet/
git add frontend/apps/admin/src/routeTree.gen.ts
git commit -m "feat(admin): add withdrawal review page"
```
