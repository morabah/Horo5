import { Navigate, useParams } from 'react-router-dom';
import { LEGACY_VIBE_SLUG_TO_FEELING_SLUG } from '../data/site';

/** `/vibes/:slug` → `/feelings/:resolvedSlug` (§6.4 migration) */
export function LegacyVibeCollectionRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/feelings" replace />;
  const next = LEGACY_VIBE_SLUG_TO_FEELING_SLUG[slug] ?? slug;
  return <Navigate to={`/feelings/${next}`} replace />;
}
