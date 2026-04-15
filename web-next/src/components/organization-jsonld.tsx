/** Site-wide Organization JSON-LD (layout). */
export function OrganizationJsonLd() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "") || "http://localhost:3000";
  const sameAsRaw = process.env.NEXT_PUBLIC_ORG_SAME_AS?.trim();
  const sameAs = sameAsRaw
    ? sameAsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HORO",
    url: site,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
