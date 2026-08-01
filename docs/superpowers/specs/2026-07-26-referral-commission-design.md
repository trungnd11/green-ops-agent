# Referral & Commission System — Design Spec

## Overview

Hệ thống cho phép User (admin vận hành) giới thiệu tài xế đăng ký và nhận hoa hồng dựa trên doanh thu của tài xế đó.

## Actors & Permissions

| Permission | Mô tả |
|------------|-------|
| `commission:view` | Xem danh sách hoa hồng |
| `commission:approve` | Duyệt/từ chối hoa hồng |
| `commission:adjust` | Sửa số tiền hoa hồng trước duyệt |
| `commission:config` | Cấu hình tỷ lệ hoa hồng |
| `user-wallet:view` | Xem ví của mình |
| `user-wallet:view-all` | Xem ví tất cả user |
| `user-wallet:withdraw` | Tạo yêu cầu rút tiền |
| `user-wallet:approve-withdrawal` | Duyệt/từ chối yêu cầu rút |
| `user-wallet:mark-paid` | Đánh dấu đã thanh toán thực tế |

## Bảng dữ liệu mới

### driver — thêm cột

| Column | Type | Description |
|--------|------|-------------|
| `referrer_id` | UUID FK → user (nullable) | User giới thiệu — gán khi tạo/sửa tài xế trên admin |

### commission_config

Cấu hình tỷ lệ hoa hồng. Độ ưu tiên: theo Driver → theo User → Global.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK → user (nullable) | null = global |
| `driver_id` | UUID FK → driver (nullable) | null = áp dụng cho mọi driver của user đó |
| `rate` | DECIMAL(5,2) | Tỷ lệ % hoa hồng |
| `note` | TEXT | |
| `created_by` | UUID FK → user | |
| `created_at` | TIMESTAMP | |

### commission_log

Ghi nhận hoa hồng tính theo từng kỳ doanh thu (hàng ngày).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `period_id` | UUID FK → revenue_period | Kỳ doanh thu |
| `driver_id` | UUID FK → driver | Tài xế |
| `referrer_id` | UUID FK → user | User nhận hoa hồng |
| `revenue_amount` | DECIMAL(15,2) | Doanh thu tài xế trong kỳ |
| `rate` | DECIMAL(5,2) | Tỷ lệ áp dụng |
| `commission_amount` | DECIMAL(15,2) | Số tiền hoa hồng |
| `original_amount` | DECIMAL(15,2) (nullable) | Số tiền gốc trước khi admin sửa |
| `adjust_reason` | TEXT (nullable) | Lý do sửa |
| `status` | VARCHAR(20) | PENDING / APPROVED / REJECTED |
| `reviewed_by` | UUID FK → user (nullable) | Admin duyệt |
| `reviewed_at` | TIMESTAMP (nullable) | |
| `reject_reason` | TEXT (nullable) | |
| `created_at` | TIMESTAMP | |

Unique constraint: `(period_id, driver_id)` — mỗi tài xế chỉ 1 khoản hoa hồng/kỳ.

### user_transaction

Giao dịch ví của User, tương tự transaction của tài xế.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK → user | |
| `transaction_code` | VARCHAR(50) UNIQUE | |
| `transaction_type` | VARCHAR(30) | commission / withdrawal / adjustment |
| `amount` | DECIMAL(15,2) | Số tiền (+/-) |
| `balance_before` | DECIMAL(15,2) | |
| `balance_after` | DECIMAL(15,2) | |
| `reference_type` | VARCHAR(50) (nullable) | "commission" |
| `reference_id` | UUID (nullable) | commission_log.id |
| `bank_name` | VARCHAR(100) (nullable) | Cho rút tiền |
| `bank_account` | VARCHAR(50) (nullable) | |
| `bank_holder` | VARCHAR(100) (nullable) | |
| `status` | VARCHAR(20) | PENDING / APPROVED / REJECTED / PAID |
| `processed_by` | UUID FK → user (nullable) | |
| `processed_at` | TIMESTAMP (nullable) | |
| `paid_at` | TIMESTAMP (nullable) | |
| `reject_reason` | TEXT (nullable) | |
| `note` | TEXT (nullable) | |
| `created_by` | UUID FK → user | |
| `created_at` | TIMESTAMP | |

### user_balance (tính động)

Không tạo bảng riêng. Balance được tính từ `user_transaction`:

```
available_balance = SUM(CASE WHEN type='commission' AND status='APPROVED' THEN amount ELSE 0 END)
                  - SUM(CASE WHEN type='withdrawal' AND status='APPROVED' THEN amount ELSE 0 END)
```

Có thể cache hoặc materialize sau nếu cần hiệu năng.

## Luồng nghiệp vụ

### 1. Import doanh thu → Tính hoa hồng

```
Import daily revenue → RevenueDetail created
  → Với mỗi RevenueDetail có driver.referrer_id != null
    → Tra commission_config ưu tiên cao nhất
    → Tính commission_amount = revenue * rate
    → Ghi commission_log (status = PENDING)
```

### 2. Admin duyệt hoa hồng

```
Admin vào /commission/review
  → Xem danh sách commission_log PENDING
  → Hành động:

  Duyệt (APPROVED):
    → status = APPROVED
    → reviewed_by = admin, reviewed_at = now
    → Tạo user_transaction:
        type=commission, amount=+commission_amount
        balance_after = balance_before + amount
        reference_type="commission", reference_id=commission_log.id
        status=APPROVED

  Sửa + Duyệt:
    → Lưu original_amount = commission_amount
    → Cập nhật commission_amount = số mới
    → Ghi adjust_reason
    → Duyệt như trên

  Từ chối (REJECTED):
    → status = REJECTED
    → reviewed_by = admin
    → Ghi reject_reason
```

### 3. User rút tiền

```
User vào /user-wallet
  → Xem số dư (tổng commission đã APPROVED - tổng withdrawal đã APPROVED)
  → Bấm "Rút tiền"
  → Nhập số tiền, tài khoản ngân hàng
  → Hệ thống kiểm tra balance >= amount
  → Tạo user_transaction:
        type=withdrawal, amount=-amount, status=PENDING

Admin vào /user-wallet/withdrawals
  → Xem danh sách PENDING
  → Duyệt → status=APPROVED (balance trừ)
  → Từ chối → status=REJECTED

Admin chuyển tiền thực tế (bên ngoài)
  → Vào sửa transaction → đánh dấu PAID
```

## Backend changes

### New files

| Module | File | Description |
|--------|------|-------------|
| domain | `CommissionConfig.java` | JPA entity |
| domain | `CommissionLog.java` | JPA entity |
| domain | `UserTransaction.java` | JPA entity |
| domain | `CommissionConfigRepository.java` | |
| domain | `CommissionLogRepository.java` | |
| domain | `UserTransactionRepository.java` | |
| application | `CommissionService.java` | Tính & duyệt hoa hồng |
| application | `UserWalletService.java` | Ví user, rút tiền |
| interfaces | `CommissionController.java` | REST API |
| interfaces | `UserWalletController.java` | REST API |

### Modified files

- `Driver.java` — thêm field `referrerId`
- V12 migration — tạo bảng + alter driver

## Frontend — Admin app screens

### 1. `/commission/review` — Duyệt hoa hồng

```
Header: ngày + số khoản chờ + tổng tiền
[ Duyệt tất cả ] [ Từ chối tất cả ]

Table:
  Tài xế | User giới thiệu | Doanh thu | Hoa hồng | Trạng thái | Hành động

Popup Sửa: sửa số tiền + lý do
Popup Từ chối: nhập lý do
```

### 2. `/commission/config` — Cấu hình

```
Global: [ 1% ]

Theo User:
  User | Tỷ lệ | [Sửa] [Xóa]

Theo Driver:
  Tài xế | User | Tỷ lệ | [Sửa] [Xóa]

[ + Thêm cấu hình ]
```

### 3. `/user-wallet` — Ví User

```
Filter: tất cả user (nếu có quyền view-all)

User: Nguyễn Văn B
Số dư khả dụng: 12,450,000 ₫
[ Rút tiền ]

Lịch sử giao dịch (type=commission / withdrawal / adjustment)
  Ngày | Loại | Số tiền | Số dư sau | Trạng thái | TK/Ngân hàng
```

### 4. `/user-wallet/withdrawals` — Duyệt rút tiền

```
Các yêu cầu chờ duyệt
  User | Số tiền | Ngân hàng | Ngày | [Duyệt] [Từ chối]

Đã duyệt — chờ thanh toán
  User | Số tiền | Ngân hàng | Ngày | [Đánh dấu đã thanh toán]
```

## Module structure (frontend)

```
modules/commission/
  api/
    commission.api.ts
    commission.queries.ts
  pages/
    commission-review-page.tsx
    commission-config-page.tsx
  routes/
    commission-review.tsx
    commission-config.tsx

modules/user-wallet/
  api/
    user-wallet.api.ts
    user-wallet.queries.ts
  pages/
    user-wallet-page.tsx
    withdrawal-review-page.tsx
  routes/
    user-wallet.tsx
    withdrawal-review.tsx
```
