import { Card } from "@xanh/ui/card";
import { Users, Receipt, DollarSign, Clock } from "lucide-react";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary text-sm">Tổng quan hệ thống</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Tổng tài xế", value: "1,284", change: "+12%" },
          { icon: Receipt, label: "Doanh thu kỳ này", value: "48.2 tỷ", change: "+8.5%" },
          { icon: DollarSign, label: "Chờ quyết toán", value: "12.5 tỷ", change: "-3.2%" },
          { icon: Clock, label: "Việc cần xử lý", value: "23", change: "+5" },
        ].map((item) => (
          <Card key={item.label} className="flex items-start gap-4">
            <div className="rounded-radius-btn bg-brand-cyan/10 text-brand-cyan flex h-12 w-12 items-center justify-center">
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-text-secondary text-xs">{item.label}</p>
              <p className="text-text-primary text-2xl font-bold">{item.value}</p>
              <p className="text-semantic-success text-xs">{item.change}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-text-primary mb-4 text-base font-semibold">Việc cần xử lý</h3>
          <div className="space-y-3">
            {[
              "Duyệt quyết toán Q2/2026",
              "Xác minh ngân hàng (5)",
              "Khiếu nại chờ xử lý (3)",
              "Import dữ liệu tháng 7",
            ].map((item) => (
              <div
                key={item}
                className="rounded-radius-btn bg-bg-subtle text-text-secondary flex items-center gap-3 px-3 py-2 text-sm"
              >
                <div className="bg-semantic-warning h-2 w-2 rounded-full" />
                {item}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-text-primary mb-4 text-base font-semibold">Doanh thu gần đây</h3>
          <div className="space-y-3">
            {[
              { label: "Quý 2/2026", value: "48.2 tỷ" },
              { label: "Tháng 6/2026", value: "16.8 tỷ" },
              { label: "Tháng 5/2026", value: "15.4 tỷ" },
              { label: "Tháng 4/2026", value: "16.0 tỷ" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-radius-btn bg-bg-subtle flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text-primary font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
