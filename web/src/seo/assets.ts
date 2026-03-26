import { getIndexablePublicPaths } from './paths';

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function createSitemapXml(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
  const urlEntries = getIndexablePublicPaths()
    .map((pathname) => {
      const loc = `${normalizedBaseUrl}${pathname === '/' ? '/' : pathname}`;
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

export function createRobotsTxt(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
  return `User-agent: *\nAllow: /\n\nSitemap: ${normalizedBaseUrl}/sitemap.xml\n`;
}
