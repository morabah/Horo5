/** Build Shopify Admin metafield value strings by type. */

export function listValue(items: string[]): string {
  return JSON.stringify(items.filter(Boolean));
}

export function richTextFromPlain(text: string): string {
  return JSON.stringify({
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: text }],
      },
    ],
  });
}

export interface MetafieldInput {
  namespace: string;
  key: string;
  type: string;
  value: string;
}

export function mf(key: string, type: string, value: string): MetafieldInput {
  return { namespace: 'custom', key, type, value };
}
