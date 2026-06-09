'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAppSearchParams } from '@/storefront/hooks/useAppSearchParams';
import {
  isShortcutActive,
  plpShortcutsForSurface,
  shortcutLabel,
  type PlpCategoryShortcut,
} from '../data/plpCategoryShortcuts';
import { useUiLocale } from '../i18n/ui-locale';

type CategoryShortcutPillsProps = {
  shortcuts?: readonly PlpCategoryShortcut[];
  surface?: 'pills' | 'drawer';
  className?: string;
  listClassName?: string;
  accentFirst?: boolean;
};

export function CategoryShortcutPills({
  shortcuts,
  surface = 'pills',
  className = '',
  listClassName = 'home-feeling-pills flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory',
  accentFirst = true,
}: CategoryShortcutPillsProps) {
  const pathname = usePathname() ?? '';
  const [params] = useAppSearchParams();
  const { locale } = useUiLocale();
  const lang = locale === 'ar' ? 'ar' : 'en';
  const items = shortcuts ?? plpShortcutsForSurface(surface);

  return (
    <nav
      className={className}
      aria-label={lang === 'ar' ? 'اختصارات التسوق' : 'Shop shortcuts'}
    >
      <div className={listClassName}>
        {items.map((shortcut) => {
          const active = isShortcutActive(shortcut, pathname, params);
          const isAccent = accentFirst && shortcut.accent;
          const pillClass = active
            ? 'border-horo-pulse bg-horo-pulse text-white'
            : isAccent
              ? ''
              : 'border-horo-root/20 bg-white text-horo-root hover:border-horo-pulse hover:text-horo-pulse';

          return (
            <Link
              key={shortcut.key}
              href={shortcut.href}
              className={`home-feeling-pill shrink-0 snap-start rounded-full border px-4 py-2 font-body text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${pillClass}`}
              aria-current={active ? 'page' : undefined}
            >
              {shortcutLabel(shortcut, lang)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
