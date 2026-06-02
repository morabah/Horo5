/** Decode common HTML entities in CMS-provided labels (e.g. `Size &amp; Help`). */
export function decodeHtmlEntities(value: string): string {
  if (!value.includes('&')) return value;
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}
