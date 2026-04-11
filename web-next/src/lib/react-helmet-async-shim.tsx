"use client";

export function HelmetProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Helmet({
  children,
}: {
  children?: React.ReactNode;
  /** Next shim ignores this; real react-helmet-async uses it for ordering */
  prioritizeSeoTags?: boolean;
}) {
  return <>{children}</>;
}
