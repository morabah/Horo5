'use client';

import { useCallback } from 'react';
import { useUiLocale } from '../i18n/ui-locale';

export function SkipLink() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.scrollIntoView({ block: 'start' });
      main.addEventListener(
        'blur',
        () => {
          main.removeAttribute('tabindex');
        },
        { once: true },
      );
    }
  }, []);

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-obsidian focus:px-4 focus:py-2.5 focus:text-white focus:shadow-lg"
    >
      {isArabic ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
    </a>
  );
}
