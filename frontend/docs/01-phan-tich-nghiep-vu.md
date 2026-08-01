# PHÂN TÍCH NGHIỆP VỤ — HỆ THỐNG QUẢN LÝ AGENT XANH SM

> **Đối tượng:** Công ty TNHH TỴ MÙI (Agent đối tác của Xanh SM)
> **Kỳ khảo sát:** Quý 2/2026 (01/04/2026 → 30/06/2026)
> **Phân tích từ:** File "Doanh thu tài xế quý 2.xlsx" (1,030 tài xế)

---

## 1. TỔNG QUAN MÔ HÌNH KINH DOANH

### 1.1. Sơ đồ tổng thể

```
XANH SM (Tập đoàn)
    │ Hợp đồng đại lý / đối tác
    ▼
CÔNG TY AGENT (TNHH TỴ MÙI)
    │ Quản lý, giám sát, quyết toán
    ▼
TÀI XẾ (Driver)
    │ Cung cấp dịch vụ vận tải
    ▼
KHÁCH HÀNG (Passenger)
```

### 1.2. Vai trò các bên

| Bên | Vai trò |
|-----|---------|
| **Xanh SM** | Cung cấp nền tảng app đặt xe, xử lý thanh toán, chạy quảng cáo/khuyến mại |
| **Agent (TỴ MÙI)** | Tuyển dụng & quản lý tài xế, theo dõi doanh thu, tính hoa hồng, quyết toán lương, quản lý cọc/tài sản |
| **Tài xế** | Lái xe, hoàn thành chuyến đi, nhận doanh thu, thanh toán các khoản phí |
| **Khách hàng** | Người dùng cuối gọi xe và trả tiền |

---

## 2. CHI TIẾT CÁC NGHIỆP VỤ CỐT LÕI

### 2.1. Quản lý tài xế (Driver Management)

**Mục tiêu:** Quản lý toàn bộ vòng đời tài xế từ tuyển dụng → hoạt động → nghỉ việc.

**Các bước nghiệp vụ:**

1. **Tiếp nhận hồ sơ**
   - Tài xế nộp: CCCD, Giấy phép lái xe, Giấy khám sức khỏe, Lý lịch tư pháp
   - Agent kiểm tra tính hợp lệ
   - Chụp ảnh/chụp CCCD

2. **Đăng ký với Xanh SM**
   - Agent tạo tài khoản tài xế trên hệ thống Xanh SM
   - Xanh SM cấp **Mã LX** (mã lái xe, VD: `GSMTYMUI003`)
   - Mã LX là định danh duy nhất trên toàn bộ hệ thống Xanh SM

3. **Ký hợp đồng**
   - Hợp đồng giữa Agent và tài xế
   - Thỏa thuận: tỷ lệ chiết khấu, tiền cọc, chính sách phạt, thưởng

4. **Nhận xe & thiết bị** (nếu có)
   - Giao xe, bàn giao tài sản
   - Nhận tiền cọc (nếu có)

5. **Theo dõi hoạt động**
   - Tài xế bắt đầu chạy
   - Agent theo dõi doanh thu, chuyến đi

6. **Nghỉ việc / chấm dứt**
   - Tất toán công nợ
   - Hoàn trả tiền cọc (nếu không nợ/phạt)
   - Thu hồi tài sản
   - Khóa tài khoản Xanh SM

**Thông tin tài xế cần quản lý:**

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| Mã LX | Text | Từ Xanh SM, unique |
| Họ tên | Text | |
| Số CCCD | Text | 12 số |
| Ngày sinh | Date | |
| Số điện thoại | Text | |
| Địa chỉ | Text | |
| Giấy phép lái xe | Text | Số GPLX, hạng |
| Ngày gia nhập | Date | |
| Ngày nghỉ việc | Date | Null nếu còn hoạt động |
| Trạng thái | Enum | `Đang hoạt động` / `Tạm dừng` / `Đã nghỉ` |
| Tiền cọc | Number | Số tiền cọc giữ |
| Ghi chú | Text | |

---

### 2.2. Quản lý doanh thu (Revenue Management)

**Mục tiêu:** Tổng hợp, theo dõi doanh thu của từng tài xế theo kỳ (tháng/quý/năm).

**Nguồn dữ liệu:**
- File Excel từ Xanh SM (hiện tại)
- API từ Xanh SM (khi có tích hợp) — *nên phát triển sau*

**Cấu trúc doanh thu theo file đã phân tích:**

#### Nhóm 1: Doanh thu gốc

| Cột | Tên | Ý nghĩa | Công thức |
|:---:|:---:|---|---|
| D | **Tổng doanh thu** | Tổng doanh thu tài xế tạo ra | Tổng tiền các chuyến |
| E | **Tổng số chuyến** | Số lượng chuyến đã hoàn thành | Đếm chuyến |

#### Nhóm 2: Các khoản khấu trừ (trừ vào doanh thu)

| Cột | Tên | Ý nghĩa | Loại |
|:---:|:---:|---|---|
| F | **Bảo hiểm** | Phí bảo hiểm mỗi chuyến | Khấu trừ bắt buộc |
| G | **Phí GD ko dùng tiền mặt** | Phí xử lý giao dịch (thẻ, ví) ~1-3% | Khấu trừ |
| H | **Chiết khấu + thuế** | Phần trăm Agent trích lại cho Xanh SM | Khấu trừ chính |
| K | **Phạt** | Tiền phạt (vi phạm, hủy chuyến, khiếu nại) | Khấu trừ |
| L | **Chi phí khác** | Chi phí phát sinh khác | Khấu trừ |
| S | **Phụ phí** | Phụ phí dịch vụ | Khấu trừ |

#### Nhóm 3: Các khoản cộng thêm

| Cột | Tên | Ý nghĩa |
|:---:|:---:|---|
| I | **Thưởng** | Tiền thưởng (chạy đủ chỉ tiêu, sự kiện) |
| J | **Thu nhập khác** | Thu nhập khác ngoài doanh thu chuyến |
| Q | **Tiền Tip** | Tiền khách bo/tip |
| R | **Khuyến mại** | Hỗ trợ khuyến mại từ Xanh SM |
| X | **Hoàn tiền sạc** | Hoàn tiền sạc xe điện (nếu xe điện) |

#### Nhóm 4: Ví & tài chính

| Cột | Tên | Ý nghĩa |
|:---:|:---:|---|
| M | **Số dư app Xanh** | Số tiền đang có trên app Xanh SM |
| N | **Tiền nạp** | Tài xế nạp thêm tiền vào app |
| O | **Đã rút** | Tài xế rút tiền từ app về |
| P | **Số dư khả dụng (ví nội bộ)** | Số tiền có thể dùng qua agent |
| U | **Số dư quẹt POS** | Số dư từ quẹt POS |
| V | **Tổng số dư** | Tổng tiền của tài xế (M + ...) |
| W | **Tiền cọc** | Tiền cọc giữ của tài xế |

#### Nhóm 5: Thông tin cá nhân

| Cột | Tên | Ý nghĩa |
|:---:|:---:|---|
| Y | **Số CCCD** | Số căn cước công dân |
| Z | **Ngày sinh** | Ngày tháng năm sinh |

### 2.3. Công thức quan trọng

Từ file dữ liệu, có thể suy luận các công thức:

```
Tổng doanh thu (D) = ... (từ Xanh SM, tổng tiền các chuyến)

Số dư app Xanh (M) = Tổng doanh thu (D) - Bảo hiểm (F) - Phí GD ko TM (G) 
                      - Chiết khấu+thuế (H) + Thưởng (I) + Thu nhập khác (J) 
                      - Phạt (K) - Chi phí khác (L) 
                      + Tiền Tip (Q) + Khuyến mại (R) + Phụ phí (S)

Tổng số dư (V) = Số dư app Xanh (M)    [trong file V = M, kiểm chứng được]
                
Số dư khả dụng (P) = Tổng số dư (V) + Tiền nạp (N) - Đã rút (O) - Tiền cọc (W)
                     ... (cần kiểm chứng công thức chính xác với agent)
```

> ⚠️ **Lưu ý:** Cột **Thu nhập ròng (T)** và **Số dư quẹt POS (U)** toàn bộ = 0 — cần xác nhận với chủ agent xem có cần tính hay không.

---

### 2.4. Quản lý ví & giao dịch (Wallet & Transactions)

**Mục tiêu:** Quản lý dòng tiền của tài xế trên hệ thống, bao gồm nạp, rút, thanh toán.

#### Các loại giao dịch:

| Mã loại | Tên | Mô tả | Ảnh hưởng |
|:-------:|:---:|-------|:----------:|
| `REVENUE` | Doanh thu | Doanh thu từ app Xanh SM | + Số dư |
| `DEDUCTION` | Khấu trừ | Các khoản khấu trừ | - Số dư |
| `TOPUP` | Nạp tiền | Tài xế nạp tiền vào ví | + Số dư |
| `WITHDRAW` | Rút tiền | Tài xế rút tiền từ ví | - Số dư |
| `BONUS` | Thưởng | Thưởng từ agent hoặc Xanh SM | + Số dư |
| `PENALTY` | Phạt | Phạt vi phạm | - Số dư |
| `DEPOSIT` | Cọc | Nộp tiền cọc | - Số dư khả dụng |
| `REFUND` | Hoàn cọc | Hoàn trả tiền cọc | + Số dư khả dụng |
| `ADJUSTMENT` | Điều chỉnh | Điều chỉnh tay | +/- |

---

### 2.5. Quy trình quyết toán (Settlement Process)

**Mô tả:** Cuối mỗi kỳ (tháng/quý), Agent sẽ tổng hợp doanh thu, tính toán các khoản và quyết toán với tài xế.

**Các bước:**

```
1. Xác định kỳ quyết toán
       │
2. Lấy dữ liệu doanh thu từ Xanh SM (Excel/API)
       │
3. Tổng hợp doanh thu từng tài xế
       │
4. Tính các khoản khấu trừ: BH, phí GD, chiết khấu, thuế
       │
5. Tính các khoản bổ sung: thưởng, tip, khuyến mại, phụ phí
       │
6. Tính số dư cuối kỳ
       │
7. Đối chiếu với tài xế (xác nhận)
       │
8. Quyết toán - chuyển tiền / trừ nợ
       │
9. Ghi nhận kết quả & xuất báo cáo
```

---

## 3. QUY TRÌNH NGHIỆP VỤ CHI TIẾT (SƠ ĐỒ LUỒNG)

### 3.1. Import doanh thu từ Excel

```
Start
  │
  ▼
Người dùng tải file Excel lên hệ thống
  │
  ▼
Hệ thống đọc file, validate:
  ├── Định dạng file (.xlsx)
  ├── Cấu trúc cột (26 cột, đúng tên)
  ├── Kiểm tra mã LX có trong hệ thống không
  │     ├── Có → tiếp tục
  │     └── Không → báo lỗi, skip hoặc tự động thêm tài xế mới
  └── Kiểm tra trùng lặp (kỳ báo cáo + mã LX)
        ├── Chưa có → thêm mới
        └── Đã có → hỏi ghi đè hay bỏ qua
  │
  ▼
Lưu dữ liệu vào database (bảng revenue)
  │
  ▼
Cập nhật số dư ví tài xế
  │
  ▼
End
```

### 3.2. Quyết toán tài xế

```
Start
  │
  ▼
Chọn kỳ quyết toán (tháng/quý)
  │
  ▼
Hệ thống tính toán:
  ├── Tổng doanh thu = SUM(chuyến)
  ├── Tổng khấu trừ = BH + Phí GD + CK + Thuế + Phạt + CP khác + Phụ phí
  ├── Tổng cộng thêm = Thưởng + TN khác + Tip + KM + Hoàn sạc
  ├── Thực nhận = Tổng DT - Khấu trừ + Cộng thêm
  └── Số dư cuối kỳ = Số dư đầu + Nạp - Rút + Thực nhận
  │
  ▼
Hiển thị chi tiết từng tài xế (có thể xem trước)
  │
  ▼
Xác nhận quyết toán:
  ├── Ghi nhận bảng kê
  ├── Cập nhật công nợ
  └── Xuất phiếu lương/phụ lục
  │
  ▼
End
```

---

## 4. CÁC THỰC THỂ DỮ LIỆU (DATA ENTITIES)

Dựa trên phân tích, các thực thể chính gồm:

### 4.1. `company` — Công ty agent
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| code | VARCHAR(20) | Mã công ty |
| name | VARCHAR(255) | Tên công ty |
| address | TEXT | Địa chỉ |
| phone | VARCHAR(20) | Số điện thoại |
| tax_code | VARCHAR(20) | Mã số thuế |
| contact_person | VARCHAR(255) | Người liên hệ |
| status | ENUM | active/inactive |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.2. `driver` — Tài xế
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| company_id | UUID | FK → company |
| driver_code | VARCHAR(50) | Mã LX từ Xanh SM (UNIQUE) |
| full_name | VARCHAR(255) | Họ tên |
| phone | VARCHAR(20) | Số điện thoại |
| email | VARCHAR(255) | Email |
| cccd | VARCHAR(20) | Số căn cước |
| cccd_issue_date | DATE | Ngày cấp CCCD |
| cccd_issue_place | VARCHAR(100) | Nơi cấp |
| birth_date | DATE | Ngày sinh |
| gender | ENUM | male/female/other |
| address | TEXT | Địa chỉ thường trú |
| license_number | VARCHAR(50) | Số GPLX |
| license_class | VARCHAR(10) | Hạng GPLX (B1, B2, C, ...) |
| join_date | DATE | Ngày gia nhập |
| resign_date | DATE | Ngày nghỉ việc (nullable) |
| status | ENUM | active/suspended/resigned |
| deposit_amount | DECIMAL(15,2) | Tiền cọc |
| avatar_url | TEXT | Ảnh đại diện |
| note | TEXT | Ghi chú |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.3. `revenue_period` — Kỳ báo cáo doanh thu
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| company_id | UUID | FK → company |
| name | VARCHAR(100) | Tên kỳ (VD: "Quý 2/2026") |
| type | ENUM | monthly/quarterly/yearly |
| start_date | DATE | Ngày bắt đầu |
| end_date | DATE | Ngày kết thúc |
| source | VARCHAR(50) | Nguồn: excel/api/manual |
| status | ENUM | draft/imported/verified/closed |
| note | TEXT | Ghi chú |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.4. `revenue_detail` — Chi tiết doanh thu tài xế trong kỳ
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| period_id | UUID | FK → revenue_period |
| driver_id | UUID | FK → driver |
| total_revenue | DECIMAL(15,2) | Tổng doanh thu (D) |
| total_trips | INT | Tổng số chuyến (E) |
| insurance_fee | DECIMAL(15,2) | Bảo hiểm (F) |
| non_cash_fee | DECIMAL(15,2) | Phí GD ko dùng tiền mặt (G) |
| discount_tax | DECIMAL(15,2) | Chiết khấu + thuế (H) |
| bonus | DECIMAL(15,2) | Thưởng (I) |
| other_income | DECIMAL(15,2) | Thu nhập khác (J) |
| penalty | DECIMAL(15,2) | Phạt (K) |
| other_cost | DECIMAL(15,2) | Chi phí khác (L) |
| xanh_balance | DECIMAL(15,2) | Số dư app Xanh (M) |
| deposit_in | DECIMAL(15,2) | Tiền nạp (N) |
| withdrawn | DECIMAL(15,2) | Đã rút (O) |
| available_balance | DECIMAL(15,2) | Số dư khả dụng - ví NB (P) |
| tip | DECIMAL(15,2) | Tiền Tip (Q) |
| promotion | DECIMAL(15,2) | Khuyến mại (R) |
| surcharge | DECIMAL(15,2) | Phụ phí (S) |
| net_income | DECIMAL(15,2) | Thu nhập ròng (T) |
| pos_balance | DECIMAL(15,2) | Số dư quẹt POS (U) |
| total_balance | DECIMAL(15,2) | Tổng số dư (V) |
| earned_amount | DECIMAL(15,2) | — (tính toán: D - F - G - H + I + J - K - L + Q + R + S) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.5. `wallet_transaction` — Lịch sử giao dịch ví

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| driver_id | UUID | FK → driver |
| transaction_code | VARCHAR(50) | Mã giao dịch (unique) |
| transaction_type | ENUM | revenue/deduction/topup/withdraw/bonus/penalty/deposit/refund/adjustment |
| amount | DECIMAL(15,2) | Số tiền (số dương: +, số âm: -) |
| balance_before | DECIMAL(15,2) | Số dư trước |
| balance_after | DECIMAL(15,2) | Số dư sau |
| reference_type | VARCHAR(50) | Loại tham chiếu: revenue_period/settlement/... |
| reference_id | UUID | ID tham chiếu |
| note | TEXT | Ghi chú |
| created_by | UUID | FK → user |
| created_at | TIMESTAMP | |

### 4.6. `settlement` — Bảng quyết toán

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| company_id | UUID | FK → company |
| period_id | UUID | FK → revenue_period |
| settlement_code | VARCHAR(50) | Mã quyết toán |
| total_drivers | INT | Tổng số tài xế |
| total_revenue | DECIMAL(15,2) | Tổng doanh thu |
| total_deduction | DECIMAL(15,2) | Tổng khấu trừ |
| total_addition | DECIMAL(15,2) | Tổng cộng thêm |
| total_payout | DECIMAL(15,2) | Tổng chi trả |
| status | ENUM | draft/pending/approved/paid/cancelled |
| approved_by | UUID | FK → user |
| approved_at | TIMESTAMP | |
| note | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.7. `settlement_detail` — Chi tiết quyết toán từng tài xế

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| settlement_id | UUID | FK → settlement |
| driver_id | UUID | FK → driver |
| revenue_detail_id | UUID | FK → revenue_detail |
| gross_revenue | DECIMAL(15,2) | Tổng doanh thu |
| total_deduction | DECIMAL(15,2) | Tổng khấu trừ |
| total_addition | DECIMAL(15,2) | Tổng cộng thêm |
| net_payable | DECIMAL(15,2) | Thực nhận |
| current_deposit | DECIMAL(15,2) | Tiền cọc hiện tại |
| note | TEXT | |
| created_at | TIMESTAMP | |

### 4.8. `user` — Người dùng hệ thống

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| company_id | UUID | FK → company |
| username | VARCHAR(50) | Tên đăng nhập |
| password_hash | VARCHAR(255) | Mật khẩu (bcrypt) |
| full_name | VARCHAR(255) | Họ tên |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(20) | Số điện thoại |
| role | ENUM | admin/manager/accountant/viewer |
| status | ENUM | active/inactive |
| last_login | TIMESTAMP | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 5. CÁC QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

### 5.1. Về tài xế
1. Mỗi tài xế có **duy nhất một Mã LX** do Xanh SM cấp
2. Một tài xế chỉ thuộc về **một công ty agent** tại một thời điểm
3. Khi tài xế nghỉ việc, phải tất toán công nợ trước khi hoàn cọc
4. CCCD phải đủ 12 số, không trùng

### 5.2. Về doanh thu
1. Một kỳ báo cáo không được trùng lặp (start_date, end_date)
2. Mỗi tài xế có duy nhất một bản ghi doanh thu trong một kỳ
3. Khi import Excel:
   - Nếu đã có dữ liệu của tài xế trong kỳ → ghi đè hoặc bỏ qua
   - Nếu mã LX chưa có trong hệ thống → có thể tạo tài xế mới tự động
4. Doanh thu chỉ được sửa/xóa khi kỳ báo cáo ở trạng thái `draft` hoặc `imported`

### 5.3. Về quyết toán
1. Chỉ quyết toán được khi kỳ báo cáo ở trạng thái `verified`
2. Một kỳ chỉ được quyết toán một lần (trừ khi hủy)
3. Quyết toán cần được phê duyệt (approved) bởi người có quyền
4. Sau khi quyết toán, trạng thái kỳ chuyển thành `closed`

### 5.4. Về tài chính
1. Mỗi giao dịch ví đều phải có lịch sử (audit trail)
2. Số dư khả dụng không được âm (trừ khi có thỏa thuận đặc biệt)

---

## 6. PHÂN TÍCH RỦI RO & GIẢI PHÁP

| Rủi ro | Mô tả | Giải pháp |
|--------|-------|-----------|
| **Dữ liệu Excel sai** | File từ Xanh SM có thể sai lệch | Validate đầu vào, cho phép sửa tay, ghi log |
| **Import trùng** | Import 2 lần cùng kỳ | Kiểm tra unique(period_id + driver_id) |
| **Số dư âm** | Tài xế nợ agent | Cảnh báo, chặn rút khi âm |
| **Mất dữ liệu** | Lỗi hệ thống | Backup tự động, audit log |
| **Bảo mật** | Lộ thông tin tài xế, doanh thu | Phân quyền, mã hóa dữ liệu nhạy cảm |

---

## 7. CÁC PHÂN HỆ CHÍNH (MODULES)

```
┌────────────────────────────────────────────────────┐
│                 HỆ THỐNG QUẢN LÝ AGENT              │
├────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  1. Dashboard │  │  2. Quản lý  │  │ 3. Quản lý │ │
│  │  (Tổng quan)  │  │   tài xế     │  │  doanh thu │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ 4. Ví & GD   │  │ 5. Quyết toán│  │  6. Báo   │ │
│  │  (tài chính)  │  │              │  │   cáo     │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐                  │
│  │  7. Người   │  │ 8. Cấu hình  │                  │
│  │   dùng/PB    │  │              │                  │
│  └─────────────┘  └──────────────┘                  │
│                                                      │
└────────────────────────────────────────────────────┘
```

### Module 1: Dashboard
- Tổng quan doanh thu (biểu đồ theo tháng/quý)
- Top tài xế doanh thu cao nhất
- Số liệu thống kê nhanh
- Cảnh báo (tài xế âm, chưa quyết toán)

### Module 2: Quản lý tài xế
- Danh sách tài xế (search, filter, sort)
- Thêm / sửa / xóa tài xế
- Import tài xế từ Excel
- Xem chi tiết: hồ sơ, doanh thu, giao dịch
- Quản lý trạng thái

### Module 3: Quản lý doanh thu
- Import Excel doanh thu
- Danh sách kỳ báo cáo
- Xem / sửa chi tiết doanh thu từng tài xế
- Xác nhận dữ liệu (verify)

### Module 4: Ví & Giao dịch
- Xem số dư từng tài xế
- Lịch sử giao dịch
- Nạp / rút tiền thủ công
- Điều chỉnh số dư

### Module 5: Quyết toán
- Tạo phiếu quyết toán theo kỳ
- Xem chi tiết từng tài xế
- Phê duyệt / từ chối
- Xuất phiếu lương Excel

### Module 6: Báo cáo
- Báo cáo tổng hợp doanh thu
- Báo cáo chi tiết tài xế
- Xuất PDF / Excel

### Module 7: Người dùng & Phân quyền
- Quản lý tài khoản
- Phân quyền: Admin, Manager, Kế toán, Xem
- Lịch sử hoạt động

### Module 8: Cấu hình
- Thông tin công ty
- Các tham số (tỷ lệ chiết khấu, phí, v.v.)
- Loại giao dịch
- Backup

---

## 8. KẾ HOẠCH PHÁT TRIỂN (ROADMAP)

| Phase | Module | Mô tả | Mức ưu tiên |
|:-----:|--------|-------|:-----------:|
| **1** | Quản lý tài xế | CRUD, import/export, tìm kiếm | ⭐⭐⭐ |
| **1** | Import doanh thu | Đọc Excel, validate, lưu | ⭐⭐⭐ |
| **1** | Dashboard | Tổng quan cơ bản | ⭐⭐⭐ |
| **2** | Ví & Giao dịch | Lịch sử, nạp/rút, điều chỉnh | ⭐⭐ |
| **2** | Quyết toán | Tạo, phê duyệt, xuất | ⭐⭐⭐ |
| **2** | Báo cáo | Tổng hợp, chi tiết, xuất file | ⭐⭐ |
| **3** | Người dùng & PB | Phân quyền, audit log | ⭐⭐ |
| **3** | Cấu hình | Tham số, backup | ⭐ |

---

## 9. CÂU HỎI CẦN XÁC NHẬN

Trước khi đi vào thiết kế chi tiết, cần làm rõ:

1. ✅ **Thu nhập ròng (T) và Số dư quẹt POS (U)** — có sử dụng không hay bỏ qua?
2. ✅ **Công thức tính "Số dư khả dụng"** chính xác là gì?
3. ✅ **Có cần quản lý xe/tài sản** không (xe giao cho tài xế)?
4. ✅ **Agent có muốn tích hợp API từ Xanh SM** sau này hay chỉ import Excel?
5. ✅ **Có cần app mobile cho tài xế** tự xem doanh thu, ví, rút tiền?
6. ✅ **Có cần quản lý hợp đồng với tài xế** (scan file, theo dõi hiệu lực)?
