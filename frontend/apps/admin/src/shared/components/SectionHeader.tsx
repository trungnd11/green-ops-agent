export function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "Manrope" }}>
      {title}
    </h2>
  );
}
