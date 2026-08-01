import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text-secondary">
        {label}
        {required && <span className="text-semantic-error"> *</span>}
      </span>
      {children}
      {error && <span className="text-[11px] text-semantic-error leading-none">{error}</span>}
    </div>
  );
}
