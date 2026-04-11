"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Rewrites `/feelings/:slug?line=subslug` → `/feelings/:slug/subslug` for canonical nested URLs. */
export function LegacyFeelingLineRedirect() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const line = searchParams.get("line")?.trim() ?? "";

  useEffect(() => {
    if (slug && line) {
      router.replace(`/feelings/${encodeURIComponent(slug)}/${encodeURIComponent(line)}`);
    }
  }, [slug, line, router]);

  return null;
}
