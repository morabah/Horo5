import type { Product, ProductMediaGalleryItem, ProductMediaGalleryTag } from './catalog-types';
import { proofCards } from './images';

export type PdpProofItem = {
  url: string;
  tag: ProductMediaGalleryTag;
};

const PROOF_TAGS: ProductMediaGalleryTag[] = ['proof_fabric', 'proof_print', 'proof_wash'];

const FALLBACK_PROOF: PdpProofItem[] = [
  { url: proofCards.macroDetail, tag: 'proof_print' },
  { url: proofCards.fabricTag, tag: 'proof_fabric' },
  { url: proofCards.washTest, tag: 'proof_wash' },
];

function isTaggedGalleryItem(entry: unknown): entry is ProductMediaGalleryItem {
  return Boolean(entry && typeof entry === 'object' && 'url' in entry && typeof entry.url === 'string');
}

/** Up to three proof images — tagged gallery first, then branded proof cards. */
export function collectPdpProofItems(product: Product, limit = 3): PdpProofItem[] {
  const fromGallery = (product.media?.gallery ?? [])
    .filter(isTaggedGalleryItem)
    .filter((item) => item.tag && PROOF_TAGS.includes(item.tag))
    .map((item) => ({ url: item.url, tag: item.tag as ProductMediaGalleryTag }));

  if (fromGallery.length >= limit) {
    return fromGallery.slice(0, limit);
  }

  const seen = new Set(fromGallery.map((item) => item.url));
  const merged = [...fromGallery];
  for (const fallback of FALLBACK_PROOF) {
    if (merged.length >= limit) break;
    if (seen.has(fallback.url)) continue;
    seen.add(fallback.url);
    merged.push(fallback);
  }

  return merged.slice(0, limit);
}
