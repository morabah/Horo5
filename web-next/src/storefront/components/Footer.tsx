import Link from 'next/link';

import { BRAND_COPY } from '../data/brand';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { NAV_ROUTE } from '../lib/navLinks';
import { useRenderTime } from '../runtime/render-time';
import { AppIcon } from './AppIcon';
import { BrandLogo } from './BrandLogo';
import { HomeFooterNewsletter } from './home/HomeFooterNewsletter';
import { HomeServiceTrust } from './home/HomeServiceTrust';

export function Footer() {
  const renderTime = useRenderTime();
  const year = renderTime.getFullYear();
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const instagramUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;
  const whatsappSupportUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;

  return (
    <>
      <HomeServiceTrust />
      <footer className="site-footer-mockup pb-[max(3rem,env(safe-area-inset-bottom))] pt-12 text-horo-breath sm:pt-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 font-body sm:px-6 md:grid-cols-5 md:gap-7 lg:px-8">
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="inline-flex items-center" aria-label={copy.shell.home}>
              <BrandLogo variant="light" showArabic={false} size="footer" />
            </Link>
            <p className="font-headline text-sm font-semibold text-horo-breath">{BRAND_COPY.mantra}</p>
            <p className="text-sm leading-relaxed text-horo-breath/88">{BRAND_COPY.canvasLine}</p>
            <div className="flex flex-wrap gap-3 pt-1 text-sm">
              {instagramUrl ? (
                <a className="inline-flex h-6 w-6 items-center justify-center text-horo-breath/88 transition-colors hover:text-white" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <AppIcon name="instagram" className="h-5 w-5" strokeWidth={1.8} />
                </a>
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center text-horo-breath/88" aria-hidden>
                  <AppIcon name="instagram" className="h-5 w-5" strokeWidth={1.8} />
                </span>
              )}
              {whatsappSupportUrl ? (
                <a className="inline-flex h-6 w-6 items-center justify-center text-horo-breath/88 transition-colors hover:text-white" href={whatsappSupportUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                  <AppIcon name="whatsapp" className="h-5 w-5" strokeWidth={1.8} />
                </a>
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center text-horo-breath/88" aria-hidden>
                  <AppIcon name="whatsapp" className="h-5 w-5" strokeWidth={1.8} />
                </span>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-label mb-4 text-[0.9rem] font-semibold tracking-[0.08em]">{copy.shell.shopHeading}</h4>
            <ul className="space-y-2.5 text-sm text-horo-breath/88">
              <li>
                <Link className="transition-colors hover:text-white" href={NAV_ROUTE.products.path}>
                  {copy.shell.shopAll}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href={NAV_ROUTE.about.path}>
                  {copy.shell.about}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href={NAV_ROUTE.products.path}>
                  {locale === 'ar' ? 'كل المنتجات' : 'All Products'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label mb-4 text-[0.9rem] font-semibold tracking-[0.08em]">{copy.shell.helpHeading}</h4>
            <ul className="space-y-2.5 text-sm text-horo-breath/88">
              <li>
                <Link className="transition-colors hover:text-white" href="/size-guide">
                  {locale === 'ar' ? copy.shell.sizeGuide : 'Size & Fit Guide'}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/faq">
                  {locale === 'ar' ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/exchange">
                  {copy.shell.deliveryReturns}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/faq">
                  {copy.shell.faq}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-label mb-4 text-[0.9rem] font-semibold tracking-[0.08em]">{copy.shell.aboutHeading}</h4>
            <ul className="space-y-2.5 text-sm text-horo-breath/88">
              <li>
                <Link className="transition-colors hover:text-white" href={NAV_ROUTE.about.path}>
                  {copy.shell.about}
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-white" href="/comparison">
                  {locale === 'ar' ? 'المجلة' : 'The Journal'}
                </Link>
              </li>
              {whatsappSupportUrl ? (
                <li>
                  <a className="transition-colors hover:text-white" href={whatsappSupportUrl} target="_blank" rel="noreferrer">
                    {locale === 'ar' ? copy.shell.contactWhatsapp : 'Contact Us'}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <HomeFooterNewsletter />
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-start justify-between gap-4 border-t border-white/12 px-4 pt-6 text-sm text-horo-breath/88 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>{`© ${year} HORO. ${locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}`}</p>
          <div className="flex flex-wrap gap-4">
            <Link className="transition-colors hover:text-white" href="/privacy">
              {copy.shell.privacyPolicy}
            </Link>
            <Link className="transition-colors hover:text-white" href="/terms">
              {copy.shell.termsOfService}
            </Link>
          </div>
          <p>{copy.home.footerMadeIn} ♡</p>
        </div>
      </footer>
    </>
  );
}
