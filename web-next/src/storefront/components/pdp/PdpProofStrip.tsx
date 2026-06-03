'use client';

import type { Product } from '../../data/catalog-types';
import { collectPdpProofItems, type PdpProofItem } from '../../data/pdpProof';
import { imgUrl } from '../../data/images';
import { useUiLocale } from '../../i18n/ui-locale';

const CAPTIONS: Record<PdpProofItem['tag'], { en: string; ar: string }> = {
  proof_fabric: { en: 'Fabric close-up', ar: 'تفاصيل القماش' },
  proof_print: { en: 'Print detail', ar: 'تفاصيل الطباعة' },
  proof_wash: { en: 'Wash proof', ar: 'اختبار الغسيل' },
  lifestyle: { en: 'Styled photo', ar: 'صورة تنسيق' },
  flat_lay: { en: 'Flat lay', ar: 'صورة مسطحة' },
  artwork_detail: { en: 'Artwork detail', ar: 'تفاصيل التصميم' },
  back: { en: 'Back view', ar: 'منظر خلفي' },
  gift: { en: 'Gift packaging', ar: 'تغليف الهدية' },
};

export function PdpProofStrip({ product }: { product: Product }) {
  const { locale } = useUiLocale();
  const lang = locale === 'ar' ? 'ar' : 'en';
  const items = collectPdpProofItems(product, 3);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-stone/25 bg-papyrus" aria-label={lang === 'ar' ? 'دليل المنتج' : 'Product proof'}>
      <div className="mx-auto max-w-[1320px] px-4 py-8 md:px-12 md:py-10">
        <p className="font-label mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
          {lang === 'ar' ? 'دليل الجودة' : 'Quality proof'}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <figure key={`${item.tag}-${item.url}`} className="overflow-hidden rounded-xl border border-stone/45 bg-white/80">
              <img
                src={imgUrl(item.url, 760)}
                alt={`${product.name} ${CAPTIONS[item.tag][lang].toLowerCase()}`}
                className="aspect-[4/3] w-full object-cover"
                width={760}
                height={570}
                loading="lazy"
              />
              <figcaption className="font-label px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-warm-charcoal">
                {CAPTIONS[item.tag][lang]}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
