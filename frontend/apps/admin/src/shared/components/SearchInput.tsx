import { useState, type ChangeEvent } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="rounded-btn flex items-center gap-2 border px-3.5 transition-colors"
      style={{
        height: "44px",
        width: "320px",
        borderColor: focused ? "#00AEEF" : "rgba(255,255,255,0.12)",
        background: "#3A4352",
      }}
    >
      <Search className="text-text-tertiary h-4 w-4 shrink-0" />
      <input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder || "Tìm kiếm..."}
        className="flex-1 bg-transparent text-[13px] text-text-primary outline-none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}
