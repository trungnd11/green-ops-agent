export function DriverCell({ name, code }: { name: string; code: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "#101B2B" }}>
        <span className="text-text-tertiary text-[12px] font-semibold">{name?.charAt(0).toUpperCase() ?? "?"}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-text-primary truncate text-[13px] font-medium">{name}</span>
        <span className="text-text-tertiary truncate text-[11px]">{code}</span>
      </div>
    </div>
  );
}
