import Link from 'next/link';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";


type ButtonVariant = "primary" | "secondary" | "ghost" | "chip";
type ButtonSize = "sm" | "md" | "lg";

const variantBase =
  "inline-flex items-center justify-center font-label font-semibold uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "min-h-12 rounded-xl border border-obsidian bg-obsidian px-6 text-[11px] text-white hover:bg-obsidian/90",
  secondary:
    "min-h-12 rounded-xl border border-stone bg-white px-6 text-[11px] text-obsidian hover:border-desert-sand",
  ghost:
    "min-h-11 rounded-sm border border-transparent px-4 py-2 text-[11px] text-obsidian hover:bg-surface-container-high",
  chip:
    "min-h-11 rounded-full border px-4 py-2 text-[10px] text-obsidian",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-[10px]",
  md: "min-h-12 px-6 text-[11px]",
  lg: "min-h-14 px-8 text-[12px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  active = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const chipActive = variant === "chip" && active;
  const chipInactive = variant === "chip" && !active;

  const chipClass = chipActive
    ? "border-obsidian bg-obsidian text-white"
    : chipInactive
      ? "border-stone bg-white hover:border-desert-sand"
      : "";

  return (
    <button
      type="button"
      className={`${variantBase} ${variantClasses[variant]} ${variant === "chip" ? chipClass : sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  children: ReactNode;
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  active = false,
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  const chipActive = variant === "chip" && active;
  const chipInactive = variant === "chip" && !active;

  const chipClass = chipActive
    ? "border-obsidian bg-obsidian text-white"
    : chipInactive
      ? "border-stone bg-white hover:border-desert-sand"
      : "";

  return (
    <Link
      href={to}
      className={`${variantBase} ${variantClasses[variant]} ${variant === "chip" ? chipClass : sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
