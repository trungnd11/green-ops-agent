export function ContactCell({ email, phone }: { email?: string; phone?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-primary truncate text-[13px]">{email || "—"}</span>
      <span className="text-text-tertiary text-[11px]">{phone || "—"}</span>
    </div>
  );
}
