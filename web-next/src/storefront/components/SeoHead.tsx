import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { buildSeoHeadArtifacts } from '../seo/headArtifacts';

function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function SeoHead() {
  const { pathname } = useLocation();
  const artifacts = buildSeoHeadArtifacts(pathname);

  return (
    <Helmet prioritizeSeoTags>
      <title>{artifacts.title}</title>
      {artifacts.metaTags.map((tag, index) => (
        <meta
          key={`meta-${index}-${tag.name ?? tag.property}`}
          {...(tag.name ? { name: tag.name } : {})}
          {...(tag.property ? { property: tag.property } : {})}
          content={tag.content}
        />
      ))}
      {artifacts.linkTags.map((tag, index) => (
        <link key={`link-${index}-${tag.rel}`} rel={tag.rel} href={tag.href} />
      ))}
      {artifacts.jsonLd.map((entry, index) => (
        <script key={`seo-ld-${index}`} type="application/ld+json">
          {jsonLdString(entry)}
        </script>
      ))}
    </Helmet>
  );
}
