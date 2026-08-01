interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      className="relative rounded-full transition-colors"
      style={{
        width: "44px",
        height: "24px",
        background: checked ? "#00C7A5" : "#3A4352",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={disabled ? undefined : onChange}
    >
      <div
        className="absolute top-0.5 rounded-full transition-transform"
        style={{
          width: "18px",
          height: "18px",
          background: "#000",
          transform: checked ? "translateX(22px)" : "translateX(4px)",
        }}
      />
    </button>
  );
}
