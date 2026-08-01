import type { FC } from "react";

interface StatsCardProps {
  icon: FC<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  color: string;
}

export function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  return (
    <div
      className="rounded-card flex flex-1 flex-col gap-1 border p-4"
      style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1C2737" }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-text-secondary text-[13px]">{label}</span>
      </div>
      <span className="text-2xl font-bold leading-none" style={{ fontFamily: "Manrope", color }}>
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </span>
    </div>
  );
}
