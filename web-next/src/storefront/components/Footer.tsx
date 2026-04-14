import { Link } from 'react-router-dom';
import { BRAND_COPY } from '../data/brand';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { useUiLocale } from '../i18n/ui-locale';
import { NAV_ROUTE } from '../lib/navLinks';
import { useRenderTime } from '../runtime/render-time';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const renderTime = useRenderTime();
  const year = renderTime.getFullYear();
  const { copy } = useUiLocale();
  const instagramUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;
  const whatsappSupportUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;
  return (
    <footer className="bg-obsidian pb-[max(3rem,env(safe-area-inset-bottom))] pt-20 text-[#f5f0e8] sm:pt-32">
      {/* Brand manifesto — cinematic closing typography */}
      <div className="mx-auto max-w-[1400px] px-[max(1rem,env(safe-area-inset-left,0px))] sm:px-8 md:px-12 mb-16 sm:mb-24">
        <p
          className="footer-watermark-a11y-exempt font-headline text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-tight text-clean-white/[0.08] select-none"
          aria-hidden="true"
        >
          {BRAND_COPY.mantra}
        </p>
      </div>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] font-body sm:gap-20 sm:px-8 md:grid-cols-4 md:px-12">
        <div className="space-y-8">
          <Link to="/" className="inline-flex items-center" aria-label={copy.shell.home}>
            <BrandLogo variant="light" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-stone">
            {BRAND_COPY.footerSummary}
          </p>
        </div>
        <div>
          <h4 className="font-body mb-8 text-sm font-semibold text-primary">{copy.shell.shopHeading}</h4>
          <ul className="space-y-4">
            <li>
              <Link
                className="font-body text-sm text-stone transition-colors hover:text-papyrus"
                to={NAV_ROUTE.collection.path}
              >
                {copy.shell.shopByFeeling}
              </Link>
            </li>
            <li>
              <Link
                className="font-body text-sm text-stone transition-colors hover:text-papyrus"
                to={NAV_ROUTE.occasions.path}
              >
                {copy.shell.shopByMoment}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-body mb-8 text-sm font-semibold text-primary">{copy.shell.aboutHeading}</h4>
          <ul className="space-y-4">
            <li>
              <Link
                className="font-body text-sm text-[#f5f0e8] underline decoration-primary underline-offset-8 transition-colors"
                to={NAV_ROUTE.about.path}
              >
                {copy.shell.about}
              </Link>
            </li>
            <li>
              <Link className="font-body text-sm text-stone transition-colors hover:text-papyrus" to="/exchange">
                {copy.shell.exchangePolicy}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-body mb-8 text-sm font-semibold text-primary">{copy.shell.contactHeading}</h4>
          <ul className="space-y-4">
            {instagramUrl ? (
              <li>
                <a className="font-body text-sm text-stone transition-colors hover:text-papyrus" href={instagramUrl} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            ) : null}
            {whatsappSupportUrl ? (
              <li>
                <a className="font-body text-sm text-stone transition-colors hover:text-papyrus" href={whatsappSupportUrl} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
            ) : null}
            <li>
              <Link className="font-body text-sm text-stone transition-colors hover:text-papyrus" to="/search">
                {copy.shell.search}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-24 flex max-w-[1400px] flex-col items-center justify-between gap-4 border-t border-stone/25 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-10 font-body text-sm text-stone sm:mt-40 sm:px-8 md:flex-row md:px-12 md:pt-12">
        <div>{`© ${year} HORO Egypt. ${BRAND_COPY.footerSignoff}`}</div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-2">
          <Link className="text-sm text-stone transition-colors hover:text-papyrus" to="/privacy">
            {copy.shell.privacyPolicy}
          </Link>
          <Link className="text-sm text-stone transition-colors hover:text-papyrus" to="/terms">
            {copy.shell.termsOfService}
          </Link>
        </div>
      </div>
    </footer>
  );
}
