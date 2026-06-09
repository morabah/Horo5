'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import type { StorefrontAnnouncementBarPayload } from '@/lib/storefront-server';
import { pickLocalizedStorefrontText } from '../data/catalog-types';
import { useUiLocale } from '../i18n/ui-locale';

const DEFAULT_ANNOUNCEMENT: StorefrontAnnouncementBarPayload = {
  active: true,
  showOnHomeOnly: false,
  messages: [
    {
      text: { en: 'Free shipping on orders over EGP 1,500', ar: 'شحن مجاني للطلبات فوق ١٬٥٠٠ جنيه' },
    },
    {
      text: { en: 'Wearable art. Bold expression. Your story.', ar: 'فن قابل للّبس. تعبير جريء. قصتك.' },
    },
    {
      text: { en: 'Delivery across Egypt', ar: 'توصيل في جميع أنحاء مصر' },
    },
  ],
};

type AnnouncementBarProps = {
  config?: StorefrontAnnouncementBarPayload | null;
  isHome?: boolean;
};

type AnnouncementMessage = { text: string; href?: string };

function MessageCell({ message, className }: { message: AnnouncementMessage; className?: string }) {
  const content = (
    <span className={`font-label text-[10px] font-semibold uppercase tracking-[0.14em] md:text-[11px] md:tracking-[0.16em] ${className ?? ''}`}>
      {message.text}
    </span>
  );
  if (message.href) {
    return (
      <Link href={message.href} className="transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80">
        {content}
      </Link>
    );
  }
  return content;
}

export function AnnouncementBar({ config, isHome = false }: AnnouncementBarProps) {
  const { locale } = useUiLocale();
  const resolved = config?.active === false ? null : config ?? DEFAULT_ANNOUNCEMENT;

  const messages = useMemo(() => {
    if (!resolved?.active && config?.active === false) return [];
    const source = resolved ?? DEFAULT_ANNOUNCEMENT;
    if (source.showOnHomeOnly && !isHome) return [];
    return (source.messages ?? [])
      .flatMap((message) => {
        const text = pickLocalizedStorefrontText(message.text, locale);
        if (!text?.trim()) return [];
        const href = typeof message.href === 'string' && message.href.trim() ? message.href.trim() : undefined;
        return [{ text: text.trim(), ...(href ? { href } : {}) }];
      });
  }, [config, isHome, locale, resolved]);

  useEffect(() => {
    const height = messages.length > 0 ? '2.25rem' : '0px';
    document.documentElement.style.setProperty('--horo-announcement-height', height);
    return () => {
      document.documentElement.style.setProperty('--horo-announcement-height', '0px');
    };
  }, [messages.length]);

  if (messages.length === 0) return null;

  const centerMessage = messages[1] ?? messages[0];
  const leftMessage = messages[0];
  const rightMessage = messages[2] ?? messages[messages.length - 1];

  return (
    <div
      className="horo-announcement-bar border-b border-white/10 bg-horo-root text-horo-breath"
      role="region"
      aria-label={locale === 'ar' ? 'إعلانات المتجر' : 'Store announcements'}
    >
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center gap-1 px-4 py-2 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] md:gap-4 lg:px-8">
        <div className="hidden min-w-0 md:block">
          <MessageCell message={leftMessage} className="text-horo-breath/92" />
        </div>
        <div className="min-w-0 text-center">
          <MessageCell message={centerMessage} />
        </div>
        <div className="hidden min-w-0 text-right md:block">
          <MessageCell message={rightMessage} className="text-horo-breath/92" />
        </div>
      </div>
    </div>
  );
}
