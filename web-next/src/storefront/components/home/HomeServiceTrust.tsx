import Link from 'next/link';

import { HORO_SUPPORT_CHANNELS, withSupportMessage } from '../../data/support-channels';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';
import { AppIcon, type AppIconName } from '../AppIcon';

const SERVICE_KEYS = ['fitGuide', 'delivery', 'exchange', 'whatsapp'] as const;
const SERVICE_ICONS: Record<(typeof SERVICE_KEYS)[number], AppIconName> = {
  fitGuide: 'checkroom',
  delivery: 'local_shipping',
  exchange: 'history',
  whatsapp: 'whatsapp',
};

export function HomeServiceTrust() {
  const copy = useDictionary();
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const whatsappHref =
    withSupportMessage(
      HORO_SUPPORT_CHANNELS.whatsappSupportUrl,
      isArabic
        ? 'محتاج مساعدة في اختيار مقاس HORO.'
        : 'I need help choosing my HORO size.',
    ) ?? copy.home.serviceTrust.whatsapp.href;

  return (
    <section
      id="size-help"
      aria-label={isArabic ? 'خدمة ما بعد الشراء' : 'Service reassurance'}
      className="home-section home-info-strip px-4 pb-3 pt-2 sm:px-6 lg:px-8"
    >
      <div className="home-info-strip__grid mx-auto max-w-6xl">
        {SERVICE_KEYS.map((key) => {
          const item = copy.home.serviceTrust[key];
          const href = key === 'whatsapp' ? whatsappHref : item.href;
          const isExternal = Boolean(href && /^https?:\/\//i.test(href));
          const inner = (
            <>
              <span className="home-info-strip__icon" aria-hidden>
                <AppIcon name={SERVICE_ICONS[key]} className="h-7 w-7" strokeWidth={1.65} />
              </span>
              <span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </span>
            </>
          );
          if (href && isExternal) {
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="home-info-strip__item transition-colors hover:text-horo-pulse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
              >
                {inner}
              </a>
            );
          }
          return href ? (
            <Link key={key} href={href} className="home-info-strip__item transition-colors hover:text-horo-pulse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse">
              {inner}
            </Link>
          ) : (
            <div key={key} className="home-info-strip__item">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
