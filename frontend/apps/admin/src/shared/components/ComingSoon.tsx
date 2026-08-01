export function ComingSoon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 opacity-50 pointer-events-none select-none">
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#3A4352", color: "#667180" }}>
      Sắp ra mắt
    </span>
  );
}
