# Revenue Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kết nối frontend Revenue module với backend có sẵn (7 endpoints), thêm màn import Excel, detail kỳ, detail tài xế.

**Architecture:** Frontend React + TanStack Query gọi backend RevenueController có sẵn. Module theo pattern `modules/revenue/` với `api/`, `pages/`, `routes/`.

**Tech Stack:** React 19, TanStack Router, TanStack Query, @xanh/ui, Ant Design Table

## Global Constraints

- Format tiền VNĐ dùng `formatCurrency` từ `@xanh/utils`
- HTTP client dùng `httpClient` từ `../../../shared/api/http-client`
- Message tiếng Việt
- Route tree đăng ký thủ công trong `routeTree.gen.ts`

---

### Task 1: Revenue API layer

**Files:**
- Create: `frontend/apps/admin/src/modules/revenue/api/revenue.types.ts`
- Create: `frontend/apps/admin/src/modules/revenue/api/revenue.api.ts`
- Create: `frontend/apps/admin/src/modules/revenue/api/revenue.queries.ts`

- [ ] **Step 1: revenue.types.ts**

```ts
export interface RevenuePeriod {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  source: string;
  status: string;
  note?: string;
  driverCount?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueDetail {
  id: string;
  driverId: string;
  driverCode: string;
  driverName: string;
  totalRevenue: number;
  totalTrips: number;
  insuranceFee: number;
  nonCashFee: number;
  discountTax: number;
  penalty: number;
  otherCost: number;
  surcharge: number;
  bonus: number;
  otherIncome: number;
  tip: number;
  promotion: number;
  chargeRefund: number;
  totalDeduction: number;
  totalAddition: number;
  earnedAmount: number;
  note?: string;
}

export interface RevenueSearchParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortDir?: string;
}
```

- [ ] **Step 2: revenue.api.ts**

```ts
import { httpClient } from "../../../shared/api/http-client";
import type { ApiResponse, LegacyPageResponse } from "../../../shared/api/api.types";
import type { RevenuePeriod, RevenueDetail, RevenueSearchParams } from "./revenue.types";

export type { RevenuePeriod, RevenueDetail };

export async function fetchPeriods(params: RevenueSearchParams = {}): Promise<LegacyPageResponse<RevenuePeriod>> {
  const q: Record<string, unknown> = {};
  if (params.page !== undefined) q.page = params.page;
  if (params.size !== undefined) q.size = params.size;
  if (params.keyword) q.keyword = params.keyword;
  if (params.status && params.status !== "all") q.status = params.status;
  if (params.sortBy) q.sortBy = params.sortBy;
  if (params.sortDir) q.sortDir = params.sortDir;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<RevenuePeriod>>>("/revenue/periods", q);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải danh sách kỳ doanh thu");
  return res.data;
}

export async function fetchPeriod(id: string): Promise<RevenuePeriod> {
  const res = await httpClient.get<ApiResponse<RevenuePeriod>>(`/revenue/periods/${id}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin kỳ doanh thu");
  return res.data;
}

export async function fetchPeriodDetails(periodId: string, params: RevenueSearchParams = {}): Promise<LegacyPageResponse<RevenueDetail>> {
  const q: Record<string, unknown> = {};
  if (params.page !== undefined) q.page = params.page;
  if (params.size !== undefined) q.size = params.size;
  const res = await httpClient.get<ApiResponse<LegacyPageResponse<RevenueDetail>>>(
    `/revenue/periods/${periodId}/details`, q);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải chi tiết doanh thu");
  return res.data;
}

export async function fetchDriverDetail(periodId: string, detailId: string): Promise<RevenueDetail> {
  const res = await httpClient.get<ApiResponse<RevenueDetail>>(`/revenue/periods/${periodId}/details/${detailId}`);
  if (!res.success || !res.data) throw new Error(res.message || "Không thể tải thông tin doanh thu tài xế");
  return res.data;
}

export async function importRevenue(periodId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await httpClient.post<ApiResponse<void>>(`/revenue/periods/${periodId}/import`, formData);
  if (!res.success) throw new Error(res.message || "Import thất bại");
}
```

- [ ] **Step 3: revenue.queries.ts**

```ts
import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchPeriods, fetchPeriod, fetchPeriodDetails, fetchDriverDetail } from "./revenue.api";
import type { RevenueSearchParams } from "./revenue.types";

export const revenueKeys = {
  all: ["revenue"] as const,
  periods: (params: RevenueSearchParams = {}) => [...revenueKeys.all, "periods", params] as const,
  period: (id: string) => [...revenueKeys.all, "period", id] as const,
  details: (periodId: string, params: RevenueSearchParams = {}) => [...revenueKeys.all, "details", periodId, params] as const,
  driverDetail: (periodId: string, detailId: string) => [...revenueKeys.all, "driver", periodId, detailId] as const,
};

export const revenueQueries = {
  periods: (params: RevenueSearchParams = {}) => queryOptions({
    queryKey: revenueKeys.periods(params),
    queryFn: () => fetchPeriods(params),
  }),
  period: (id: string) => queryOptions({
    queryKey: revenueKeys.period(id),
    queryFn: () => fetchPeriod(id),
  }),
  details: (periodId: string, params: RevenueSearchParams = {}) => queryOptions({
    queryKey: revenueKeys.details(periodId, params),
    queryFn: () => fetchPeriodDetails(periodId, params),
  }),
  driverDetail: (periodId: string, detailId: string) => queryOptions({
    queryKey: revenueKeys.driverDetail(periodId, detailId),
    queryFn: () => fetchDriverDetail(periodId, detailId),
  }),
};
```

---

### Task 2: Revenue list page (sửa từ mock data sang API)

**Files:**
- Modify: `frontend/apps/admin/src/modules/revenue/pages/revenue-list-page.tsx`

Sửa page hiện tại để gọi API thay vì mock data, thêm KPIs động.

```tsx
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@xanh/ui/table";
import { Badge } from "@xanh/ui/badge";
import { Card } from "@xanh/ui/card";
import { Button } from "@xanh/ui";
import { Plus, Upload } from "lucide-react";
import { revenueQueries } from "../api/revenue.queries";
import type { RevenuePeriod } from "../api/revenue.types";
import { formatCurrency } from "@xanh/utils";

const STATUS_VARIANT: Record<string, string> = {
  draft: "warning",
  imported: "info",
  verified: "success",
  closed: "default",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  imported: "Đã import",
  verified: "Đã xác thực",
  closed: "Đã đóng",
};

export function RevenueListPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/revenues" }) as Record<string, unknown>;
  const page = Number(search.page || 0);
  const keyword = String(search.keyword || "");
  const status = String(search.status || "all");

  const { data, isLoading } = useQuery(revenueQueries.periods({ page, keyword, status }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Danh sách kỳ doanh thu</h1>
          <p className="text-sm text-text-tertiary">Quản lý các kỳ doanh thu</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate({ to: "/revenues/import" } as any)}>
            <Upload className="h-4 w-4" /> Import Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-text-secondary">Tổng kỳ</p>
          <p className="text-2xl font-bold">{data?.totalElements || 0}</p>
        </Card>
      </div>

      <Card className="p-0">
        <Table<RevenuePeriod>
          dataSource={data?.items || []}
          isLoading={isLoading}
          columns={[
            { title: "Kỳ doanh thu", render: (_, r) => r.name },
            { title: "Thời gian", render: (_, r) => `${r.startDate} - ${r.endDate}` },
            { title: "Tài xế", render: (_, r) => r.driverCount ?? "—" },
            { title: "Doanh thu", render: (_, r) => formatCurrency(r.totalRevenue || 0) },
            { title: "Trạng thái", render: (_, r) => (
              <Badge variant={STATUS_VARIANT[r.status] as any}>{STATUS_LABEL[r.status] || r.status}</Badge>
            )},
          ]}
          onRowClick={(r) => navigate({ to: `/revenues/${r.id}` } as any)}
          pagination={{
            current: page + 1,
            pageSize: data?.size || 20,
            total: data?.totalElements || 0,
            onChange: (p: number) => navigate({ to: "/revenues", search: { ...search, page: p - 1 } as any, replace: true }),
          }}
        />
      </Card>
    </div>
  );
}
```

---

### Task 3: Revenue period detail page

**Files:**
- Create: `frontend/apps/admin/src/modules/revenue/pages/revenue-detail-page.tsx`
- Create: `frontend/apps/admin/src/modules/revenue/routes/$periodId.tsx`

Page hiển thị KPIs + danh sách tài xế trong kỳ.

---

### Task 4: Revenue driver detail page

**Files:**
- Create: `frontend/apps/admin/src/modules/revenue/pages/revenue-driver-detail-page.tsx`
- Create: `frontend/apps/admin/src/modules/revenue/routes/$periodId.driver-$driverId.tsx`

Page hiển thị chi tiết doanh thu 1 tài xế.

---

### Task 5: Import page

**Files:**
- Create: `frontend/apps/admin/src/modules/revenue/pages/revenue-import-page.tsx`
- Create: `frontend/apps/admin/src/modules/revenue/routes/revenue-import.tsx`

Page upload Excel → gọi API import.

---

### Task 6: Route registration

**Files:**
- Modify: `frontend/apps/admin/src/routeTree.gen.ts`

Thêm routes mới: `/revenues/import`, `/revenues/$periodId`, `/revenues/$periodId/drivers/$driverId`.
