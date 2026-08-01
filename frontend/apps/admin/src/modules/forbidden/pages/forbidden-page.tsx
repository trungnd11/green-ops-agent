import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-[20px]"
        style={{ background: "rgba(245,158,11,0.12)" }}
      >
        <ShieldAlert className="text-semantic-warning h-9 w-9" />
      </div>
      <h1 className="text-text-primary text-[20px] font-semibold" style={{ fontFamily: "Manrope" }}>
        Bạn không có quyền truy cập
      </h1>
      <p className="text-text-tertiary max-w-sm text-center text-[14px] leading-relaxed">
        Liên hệ quản trị viên của công ty để được cấp quyền.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          className="rounded-btn flex items-center justify-center gap-1.5 border text-[13px] font-medium"
          style={{ height: "44px", padding: "0 20px", borderColor: "rgba(255,255,255,0.12)", color: "#F8FAFC" }}
          onClick={() => navigate({ to: "/admin", search: { page: 0, keyword: "", status: "" } as any })}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <button
          className="rounded-btn bg-brand-teal flex items-center justify-center gap-1.5 text-[13px] font-medium text-white"
          style={{ height: "44px", padding: "0 20px" }}
          onClick={() => navigate({ to: "/" })}
        >
          <Home className="h-4 w-4" />
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
