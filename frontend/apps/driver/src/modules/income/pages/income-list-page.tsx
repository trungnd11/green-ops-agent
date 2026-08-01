import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Input } from "@xanh/ui/input";
import { Skeleton } from "@xanh/ui/skeleton";
import { fetchRevenueHistory } from "../api/income.api";
import { formatCurrency } from "@xanh/utils";

export function IncomeListPage() {
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: periods, isFetching } = useQuery({
    queryKey: ["driver-revenue", debounced],
    queryFn: () => fetchRevenueHistory(debounced || undefined),
    placeholderData: (prev) => prev,
  });

  if (!periods) return (
    <div className="space-y-4 p-4">
      <Input placeholder="Tìm kiếm theo tháng, quý..." disabled />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-text-primary">Doanh thu</h1>
      </div>

      <div className="px-4">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm theo tháng, quý..."
        />
      </div>

      <div className="space-y-3 px-4 pb-4">
        {isFetching ? (
          <>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </>
        ) : (periods || []).map((period, i) => (
          <div
            key={i}
            className="rounded-card border border-border-default bg-surface-card p-4 cursor-pointer hover:bg-bg-subtle transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{period.periodName}</h3>
                <p className="text-xs text-text-tertiary">{period.startDate} - {period.endDate}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Doanh thu</span>
                <span className="text-text-primary">{formatCurrency(period.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Chuyến</span>
                <span className="text-text-primary">{period.totalTrips}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Thực nhận</span>
                <span className="text-text-tertiary">{formatCurrency(period.earnedAmount)}</span>
              </div>
            </div>
          </div>
        ))}
        {!isFetching && (!periods || periods.length === 0) && (
          <p className="text-center text-text-tertiary py-8">
            {keyword ? "Không tìm thấy kỳ doanh thu" : "Chưa có dữ liệu doanh thu"}
          </p>
        )}
      </div>
    </div>
  );
}
