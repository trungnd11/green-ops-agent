import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
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
      <div className="input-shell" style={{ opacity: 0.5 }}>
        <Search size={17} strokeWidth={1.8} />
        <input type="search" placeholder="Tìm kiếm theo tháng, quý..." disabled />
      </div>
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <h1 className="h1">Doanh thu</h1>
      </div>
      <div className="input-shell" data-od-id="income-search">
        <Search size={17} strokeWidth={1.8} />
        <input
          type="search"
          placeholder="Tìm kiếm theo tháng, quý..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div id="incomeList" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isFetching ? (
          <>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </>
        ) : (periods || []).map((period, i) => (
          <div key={i} className="period-card glass tap" data-od-id={`income-period-${i + 1}`}>
            <div className="row-between">
              <div>
                <h3 className="h2">{period.periodName}</h3>
                <p className="meta" style={{ marginTop: 3 }}>{period.startDate} – {period.endDate}</p>
              </div>
              <ChevronRight size={18} strokeWidth={1.8} style={{ color: "var(--meta)" }} />
            </div>
            <hr className="divider" style={{ margin: "14px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div className="row-between">
                <span className="muted" style={{ fontSize: 13 }}>Doanh thu</span>
                <span className="num" style={{ fontWeight: 600 }}>{formatCurrency(period.totalRevenue)}</span>
              </div>
              <div className="row-between">
                <span className="muted" style={{ fontSize: 13 }}>Chuyến</span>
                <span className="num" style={{ fontWeight: 600 }}>{period.totalTrips}</span>
              </div>
              <div className="row-between">
                <span className="muted" style={{ fontSize: 13 }}>Thực nhận</span>
                <span className="num" style={{ fontWeight: 600, color: "var(--success)" }}>{formatCurrency(period.earnedAmount)}</span>
              </div>
            </div>
          </div>
        ))}
        {!isFetching && (!periods || periods.length === 0) && (
          <p className="meta" style={{ textAlign: "center", padding: "28px 0" }}>
            {keyword ? "Không tìm thấy kỳ doanh thu" : "Chưa có dữ liệu doanh thu"}
          </p>
        )}
      </div>
    </div>
  );
}
