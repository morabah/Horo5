import { useEffect, useState } from 'react';
import { useUiLocale } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';

const FIRST_DROP_STORAGE_KEY = 'horo-first-drop-v1';

function saveFirstDropEntry(value: string) {
  try {
    const existing = loadFirstDropEntries();
    const next = Array.from(new Set([...existing, value.trim().toLowerCase()]));
    localStorage.setItem(FIRST_DROP_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — WhatsApp is the primary capture anyway
  }
}

function loadFirstDropEntries(): string[] {
  try {
    const raw = localStorage.getItem(FIRST_DROP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * "First Drop Circle" — waitlist section.
 * Primary action opens WhatsApp with a prefilled message.
 * localStorage is a temporary enhancement, not the real capture mechanism.
 */
export function HomeFirstDropCircle() {
  const { copy } = useUiLocale();
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawWhatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : undefined;

  // Ensure wa.me links include a recipient (pathname longer than "/")
  const whatsappUrl = (() => {
    if (!rawWhatsappUrl) return undefined;
    try {
      const u = new URL(rawWhatsappUrl);
      if (u.hostname === 'wa.me' && u.pathname.length <= 1) return undefined;
      return rawWhatsappUrl;
    } catch {
      return undefined;
    }
  })();

  const whatsappMessage = encodeURIComponent(
    'Hi HORO — I\'d like to join the First Drop Circle and hear about new pieces first.',
  );

  // Build WhatsApp deep link with prefilled message
  const whatsappHref = whatsappUrl
    ? `${whatsappUrl}${whatsappUrl.includes('?') ? '&' : '?'}text=${whatsappMessage}`
    : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val || !whatsappHref) return;

    // Primary: open WhatsApp
    if (mounted) {
      saveFirstDropEntry(val);
    }
    window.open(whatsappHref, '_blank', 'noopener');
    setSubmitted(true);
  }

  return (
    <section
      aria-labelledby="home-first-drop-title"
      className="border-t border-stone/20 bg-obsidian px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">
          {copy.home.firstDropEyebrow}
        </p>
        <h2
          id="home-first-drop-title"
          data-reveal
          className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-white md:text-[1.75rem]"
        >
          {copy.home.firstDropTitle}
        </h2>
        <p className="font-body mt-3 text-[15px] leading-relaxed text-white/72">
          {copy.home.firstDropBody}
        </p>

        {!whatsappUrl ? (
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4" role="status">
            <p className="font-body text-sm font-medium text-white">
              {copy.home.firstDropUnavailableMessage}
            </p>
          </div>
        ) : submitted ? (
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4" role="status">
            <p className="font-body text-sm font-medium text-white">
              {copy.home.firstDropConfirm}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-center">
            <label className="sr-only" htmlFor="first-drop-input">
              {copy.home.firstDropPlaceholder}
            </label>
            <input
              id="first-drop-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={copy.home.firstDropPlaceholder}
              className="font-body min-h-12 flex-1 rounded-md border border-white/25 bg-white/10 px-4 text-sm text-white placeholder-white/50 outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 sm:max-w-xs"
            />
            <button
              type="submit"
              className="font-body min-h-12 rounded-md bg-white px-7 py-3 text-sm font-semibold text-obsidian transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {copy.home.firstDropCta}
            </button>
          </form>
        )}

        <p className="font-body mt-4 text-[11px] leading-relaxed text-white/40">
          {copy.home.firstDropDisclaimer}
        </p>
      </div>
    </section>
  );
}
