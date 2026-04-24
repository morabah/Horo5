import type { ReactNode } from "react";

type BadgeVariant = "default" | "promo" | "accent";

const badgeBase =
  "inline-flex min-h-9 items-center rounded-full border px-3 py-2 font-label text-[10px] font-medium uppercase tracking-[0.18em]";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-stone bg-white text-clay shadow-sm",
  promo: "border-ember bg-white text-ember shadow-sm",
  accent: "border-desert-sand bg-white text-desert-sand shadow-sm",
};

export function Badge({
  variant = "default",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`${badgeBase} ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}
