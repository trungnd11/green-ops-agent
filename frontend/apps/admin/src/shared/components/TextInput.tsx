import { type InputHTMLAttributes, forwardRef } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ hasError, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-btn border px-3.5 text-[13px] outline-none placeholder:text-text-tertiary ${className ?? ""}`}
        style={{
          height: "48px",
          borderColor: hasError ? "#F05252" : "rgba(255,255,255,0.12)",
          background: "#3A4352",
        }}
        {...props}
      />
    );
  },
);
TextInput.displayName = "TextInput";
