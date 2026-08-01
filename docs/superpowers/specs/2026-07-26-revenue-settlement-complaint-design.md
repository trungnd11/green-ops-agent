# Revenue, Settlement & Complaint Screens — Design Spec

## Overview

Xây dựng/hoàn thiện 3 module: Doanh thu (Revenue), Quyết toán (Settlement), Khiếu nại (Complaint). Doanh thu và Quyết toán đã có backend controller + entity, cần kết nối frontend. Khiếu nại xây mới toàn bộ backend + frontend (admin app + driver app).

---

## Module 1: Doanh thu (Revenue)

### Backend (đã có)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/revenue/periods` | GET | Danh sách kỳ (có page, sort) |
| `/revenue/periods/{id}` | GET | Chi tiết kỳ |
| `/revenue/periods` | POST | Tạo kỳ mới |
| `/revenue/periods/{id}/status` | PATCH | Cập nhật trạng thái |
| `/revenue/periods/{id}/import` | POST | Import Excel |
| `/revenue/periods/{periodId}/details` | GET | Danh sách revenue detail của kỳ |
| `/revenue/periods/{periodId}/details/{detailId}` | GET | Revenue detail của 1 tài xế |

### Frontend

| Màn | Route | Mô tả |
|-----|-------|-------|
| Danh sách kỳ | `/revenues` | KPIs + Table + Filter |
| Import | `/revenues/import` | Upload Excel -> Preview -> Confirm |
| Detail kỳ | `/revenues/{periodId}` | KPIs + driver list table |
| Detail tài xế | `/revenues/{periodId}/drivers/{driverId}` | Revenue detail 1 tài xế |

### Layout: Danh sách kỳ

```
Header: Danh sách kỳ doanh thu
[Import Excel] [Tạo kỳ mới]

KPIs: Tổng kỳ | Đang mở | Đã khóa | Đã quyết toán

Table:
Kỳ doanh thu | Thời gian | Tài xế | Doanh thu | Trạng thái
  → click vào row → detail kỳ
```

### Layout: Detail kỳ

```
Header: {periodName}
[Import lại] [Quyết toán]

KPIs: Tổng doanh thu | Tổng tài xế | Tổng chuyến | Phí GD

Table:
Mã LX | Tên | Doanh thu | Chuyến | Bảo hiểm | Phí GD | Chiết khấu+thuế | Thưởng | Thực nhận
  → click vào row → detail tài xế
```

### Module structure

```
modules/revenue/
  api/
    revenue.api.ts
    revenue.types.ts
    revenue.queries.ts
  pages/
    revenue-list-page.tsx
    revenue-import-page.tsx
    revenue-detail-page.tsx
    revenue-driver-detail-page.tsx
  routes/
    revenue-list.tsx
    revenue-import.tsx
    $periodId.tsx
    $periodId.driver-$driverId.tsx
```

---

## Module 2: Quyết toán (Settlement)

### Backend (đã có)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/settlements` | GET | Danh sách quyết toán |
| `/settlements/{id}` | GET | Chi tiết quyết toán |
| `/settlements/{id}/details` | GET | Danh sách settlement detail |
| `/settlements/create/{periodId}` | POST | Tạo quyết toán từ kỳ doanh thu |
| `/settlements/{id}/approve` | POST | Duyệt quyết toán |
| `/settlements/{id}/pay` | POST | Xác nhận đã thanh toán |

### Frontend

| Màn | Route | Mô tả |
|-----|-------|-------|
| Danh sách | `/settlements` | KPIs + Table |
| Chi tiết | `/settlements/{id}` | Driver list + actions (approve/pay) |

### Layout: Danh sách

```
Header: Quyết toán

KPIs: Tổng phải trả | Đã thanh toán | Đang tạm giữ

Table:
Mã quyết toán | Kỳ | Tài xế | Tổng doanh thu | Khấu trừ | Cộng thêm | Thực trả | Trạng thái
```

### Layout: Chi tiết

```
Header: Quyết toán {code}

Summary: Tổng doanh thu | Tổng khấu trừ | Tổng cộng thêm | Thực trả

[ Duyệt ] [ Từ chối ] [ Đánh dấu đã thanh toán ] (tùy trạng thái)

Table:
Mã LX | Tên | Doanh thu gộp | Khấu trừ | Cộng thêm | Thực nhận | Tiền cọc | Ghi chú
```

### Luồng

```
Import revenue → Tạo quyết toán từ kỳ (POST /settlements/create/{periodId})
  → status = draft
  → Admin duyệt (POST /settlements/{id}/approve)
  → status = approved
  → Admin thanh toán thực tế → đánh dấu đã thanh toán (POST /settlements/{id}/pay)
  → status = paid, revenue period đóng
```

---

## Module 3: Khiếu nại (Complaint)

### Backend (xây mới)

#### Entity: Complaint

| Column | Type | Mô tả |
|--------|------|-------|
| id | UUID PK | |
| driver_id | UUID FK → driver | Tài xế gửi khiếu nại (nullable — admin có thể tạo) |
| settlement_id | UUID FK → settlement (nullable) | Kỳ quyết toán liên quan |
| code | VARCHAR(50) UNIQUE | Mã khiếu nại (KN-YYYYMMDD-XXXX) |
| category | VARCHAR(50) | doanh_thu / khau_tru / phat / khac |
| title | VARCHAR(255) | Tiêu đề |
| description | TEXT | Nội dung |
| amount | DECIMAL(15,2) | Số tiền khiếu nại (nếu có) |
| evidence | JSONB | Mảng URL ảnh / file minh chứng `["url1","url2"]` |
| status | VARCHAR(20) | pending / processing / resolved / rejected |
| response | TEXT | Phản hồi từ admin |
| responded_by | UUID FK → user | Admin phản hồi |
| responded_at | TIMESTAMP | |
| created_by | UUID FK → user | Người tạo (có thể là driver) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/complaints` | GET | Danh sách (admin — tất cả; driver — chỉ của mình) |
| `/complaints/{id}` | GET | Chi tiết |
| `/complaints` | POST | Tạo khiếu nại (driver hoặc admin) |
| `/complaints/{id}/respond` | POST | Admin phản hồi |
| `/complaints/stats` | GET | KPIs (admin) |

### Frontend — Admin app

| Màn | Route | Mô tả |
|-----|-------|-------|
| Danh sách | `/complaints` | KPIs + Table + Filter |
| Chi tiết | `/complaints/{id}` | Thông tin + phản hồi |

#### Layout: Danh sách

```
Header: Khiếu nại

KPIs: Mới | Đang xử lý | Đã giải quyết | Đã từ chối

[Lọc: Tất cả | Chờ xử lý | Đang xử lý | Đã giải quyết | Đã từ chối]

Table:
Mã KN | Tài xế | Kỳ | Loại | Số tiền | Ngày | Trạng thái
```

#### Layout: Chi tiết

```
Thông tin:
  Mã: KN-20260726-0001
  Tài xế: Trần Tuấn Anh (GSMTYMUI003)
  Kỳ: Q2/2026
  Loại: Doanh thu
  Số tiền: 500,000₫
  Mô tả: [nội dung khiếu nại]
  Minh chứng: [ảnh đính kèm]

Phản hồi
  [TextArea] Ghi phản hồi...
  [Gửi phản hồi] [Đánh dấu đã giải quyết] [Từ chối]

Lịch sử:
  [Timeline: created_at → responded_at]
```

### Frontend — Driver app

Thêm vào driver app — màn khiếu nại:

| Màn | Route | Mô tả |
|-----|-------|-------|
| Danh sách | `/complaints` | Khiếu nại của tôi |
| Tạo mới | `/complaints/create` | Form tạo khiếu nại |

---

## File structure tổng thể

### Backend mới

```
domain/
  Complaint.java
  ComplaintRepository.java

application/
  dto/ComplaintResponse.java
  dto/ComplaintRequest.java
  dto/ComplaintStatsResponse.java
  service/ComplaintService.java

interfaces/
  controller/ComplaintController.java

bootstrap/.../migration/
  V13__create_complaints.sql
```

### Frontend

```
modules/revenue/api/      (mới)
modules/revenue/pages/    (sửa + thêm)
modules/settlements/api/  (mới)
modules/settlements/pages/ (sửa + thêm)
modules/complaints/api/   (mới)
modules/complaints/pages/ (sửa + thêm)
modules/complaints/routes/ (sửa)

apps/driver/src/modules/complaints/ (mới)
```
