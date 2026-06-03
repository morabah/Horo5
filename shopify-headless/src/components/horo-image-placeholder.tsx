type HoroImagePlaceholderProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function HoroImagePlaceholder({
  label = "HORO artwork preview coming soon",
  className = "",
  compact = false,
}: HoroImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={[
        "absolute inset-0 flex flex-col items-center justify-center bg-[#faf7f6] px-3 text-center",
        compact ? "gap-1" : "gap-1.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "font-bold uppercase tracking-[0.2em] text-[#c24f45]/70",
          compact ? "text-[9px]" : "text-[11px]",
        ].join(" ")}
      >
        HORO
      </span>
      <span
        className={[
          "max-w-[11rem] leading-snug text-[#352f31]/45",
          compact ? "text-[9px]" : "text-[11px]",
        ].join(" ")}
      >
        Artwork preview coming soon
      </span>
    </div>
  );
}
