import type { ReactNode } from "react";

/**
 * Minimal skeleton family using Tailwind animate-pulse and existing brand tokens.
 * No arbitrary hex values — only token-based colors (chalk, stone, linen, etc.).
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      className={`animate-pulse rounded-sm bg-linen ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="aspect-[4/5] w-full rounded-[18px]" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="vibe-product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="route-loading-mark" aria-hidden>
        <svg
          viewBox="0 0 40 40"
          width="40"
          height="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="10" x2="12" y2="30" />
          <line x1="28" y1="10" x2="28" y2="30" />
          <line x1="12" y1="20" x2="28" y2="20" />
        </svg>
      </div>
      {children ? (
        <div className="w-full max-w-2xl">{children}</div>
      ) : null}
    </div>
  );
}
