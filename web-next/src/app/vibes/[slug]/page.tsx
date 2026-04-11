import { redirect } from "next/navigation";
import { LEGACY_VIBE_SLUG_TO_FEELING_SLUG } from "../../../../../web/src/data/legacy-slugs";

/** Same behavior as `web/src/routes/LegacyVibeRedirect.tsx` — single source of truth in `site.ts`. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const next = LEGACY_VIBE_SLUG_TO_FEELING_SLUG[slug] ?? slug;
  redirect(`/feelings/${next}`);
}
