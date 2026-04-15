import type { UiLocale } from '../i18n/ui-locale';

type Props = {
  locale: UiLocale;
  /** Arabic line (shown first when `locale` is `en`). */
  arabic: string;
  /** English line (shown second when `locale` is `en`; primary when `locale` is `ar` and Arabic empty). */
  english: string;
  className?: string;
};

/**
 * Arabic-first stacking for service/trust microcopy on English locale (tidy plan §1.10).
 * Does not rewrite strings — parents pass both lines from `ui-locale` / Medusa-backed labels.
 */
export function BilingualServiceBlock({ locale, arabic, english, className }: Props) {
  const ar = arabic.trim();
  const en = english.trim();
  if (!ar && !en) return null;

  if (locale === 'ar') {
    return (
      <p className={className} dir="rtl" lang="ar">
        {ar || en}
      </p>
    );
  }

  if (!ar) {
    return <p className={className}>{en}</p>;
  }

  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      <p className="text-sm font-medium text-obsidian" dir="rtl" lang="ar">
        {ar}
      </p>
      {en ? <p className="text-xs leading-snug text-warm-charcoal">{en}</p> : null}
    </div>
  );
}
