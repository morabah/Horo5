'use client';

import { useMemo, useState } from 'react';

import type { Product } from '../data/catalog-types';
import { HomeFoundingProductCard } from './home/HomeFoundingProductCard';
import { DICTIONARY } from '../i18n/dictionary';
import {
  compareLaunchProducts,
  getLaunchGroup,
  LAUNCH_GROUP_SECTION_ORDER,
  type ResolvedLaunchGroup,
} from '../lib/launch-taxonomy-display';
import { useDictionary } from '../i18n/ui-locale';

type LaunchChip = 'all' | 'zodiac_capsule' | 'mood' | 'lifestyle';

const CHIP_ORDER: LaunchChip[] = ['all', 'zodiac_capsule', 'mood', 'lifestyle'];

function groupHeadingKey(group: ResolvedLaunchGroup): keyof typeof DICTIONARY.en.home | null {
  switch (group) {
    case 'zodiac_capsule':
      return 'foundingDropGroupZodiac';
    case 'mood':
      return 'foundingDropGroupMood';
    case 'lifestyle':
      return 'foundingDropGroupLifestyle';
    case 'unknown':
      return 'foundingDropGroupOther';
    default:
      return null;
  }
}

/** Grouped founding-drop grid with launch taxonomy chips — for PLP experiments, not homepage. */
export function LaunchGroupedProductGrid({ products }: { products: Product[] }) {
  const copy = useDictionary();
  const [activeChip, setActiveChip] = useState<LaunchChip>('all');

  const sortedProducts = useMemo(
    () => [...products].sort(compareLaunchProducts),
    [products],
  );

  const filteredProducts = useMemo(() => {
    if (activeChip === 'all') return sortedProducts;
    return sortedProducts.filter((product) => getLaunchGroup(product) === activeChip);
  }, [activeChip, sortedProducts]);

  const groupedSections = useMemo(() => {
    if (activeChip !== 'all') {
      return [{ group: activeChip as ResolvedLaunchGroup, items: filteredProducts }];
    }
    const buckets = new Map<ResolvedLaunchGroup, Product[]>();
    for (const group of LAUNCH_GROUP_SECTION_ORDER) {
      buckets.set(group, []);
    }
    for (const product of sortedProducts) {
      const group = getLaunchGroup(product);
      buckets.get(group)?.push(product);
    }
    return LAUNCH_GROUP_SECTION_ORDER
      .map((group) => ({ group, items: buckets.get(group) ?? [] }))
      .filter((section) => section.items.length > 0);
  }, [activeChip, filteredProducts, sortedProducts]);

  const chipLabels: Record<LaunchChip, string> = {
    all: copy.home.foundingDropFilterAll,
    zodiac_capsule: copy.home.foundingDropFilterZodiac,
    mood: copy.home.foundingDropFilterMood,
    lifestyle: copy.home.foundingDropFilterLifestyle,
  };

  let cardIndex = 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label={copy.home.startHereEyebrow}>
        {CHIP_ORDER.map((chip) => (
          <button
            key={chip}
            type="button"
            role="tab"
            aria-selected={activeChip === chip}
            onClick={() => setActiveChip(chip)}
            className={`font-label inline-flex min-h-10 items-center rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse ${
              activeChip === chip
                ? 'border-horo-pulse bg-horo-pulse text-white'
                : 'border-stone/60 bg-white text-horo-root hover:border-horo-pulse/40'
            }`}
          >
            {chipLabels[chip]}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {groupedSections.map(({ group, items }) => {
          const headingKey = groupHeadingKey(group);
          const headingValue = headingKey ? copy.home[headingKey] : null;
          const heading = typeof headingValue === 'string' ? headingValue : null;
          return (
            <div key={group}>
              {activeChip === 'all' && heading ? (
                <h3 className="home-section-eyebrow mb-4 text-horo-root">{heading}</h3>
              ) : null}
              <div className="home-founding-grid">
                {items.map((product) => {
                  const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[cardIndex % 5];
                  const eager = cardIndex < 3;
                  cardIndex += 1;
                  return (
                    <HomeFoundingProductCard
                      key={product.slug}
                      product={product}
                      eager={eager}
                      data-reveal={reveal}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
