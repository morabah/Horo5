'use client';

import { useId, useState, type FormEvent } from 'react';

import { useUiLocale } from '../i18n/ui-locale';
import { submitPdpNotify } from '../utils/pdpNotifyRestock';

type NotifyWhenAvailableButtonProps = {
  productId: string;
  productSlug: string;
  productName: string;
  className?: string;
  compact?: boolean;
};

export function NotifyWhenAvailableButton({
  productId,
  productSlug,
  productName,
  className = '',
  compact = false,
}: NotifyWhenAvailableButtonProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(true);
      return;
    }
    setError(false);
    setPending(true);
    const ok = await submitPdpNotify({
      productId,
      productSlug,
      email: trimmed,
      locale,
    });
    setPending(false);
    if (ok) {
      setSuccess(true);
      setOpen(false);
    } else {
      setError(true);
    }
  }

  if (success) {
    return (
      <p className={`font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-deep-teal ${className}`.trim()} role="status">
        {isArabic ? 'سنبلغك عند التوفر' : "We'll email you when it's back"}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-expanded={false}
      >
        {isArabic ? 'أبلغني عند التوفر' : 'Notify when available'}
      </button>
    );
  }

  return (
    <form
      className={`space-y-2 ${className}`.trim()}
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
    >
      <label htmlFor={fieldId} className="sr-only">
        {isArabic ? 'البريد للإشعار' : 'Email for back-in-stock alert'}
      </label>
      <input
        id={fieldId}
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={isArabic ? 'بريدك' : 'Your email'}
        aria-invalid={error}
        className={`w-full rounded-lg border border-stone/50 bg-white px-3 text-obsidian placeholder:text-clay focus-visible:border-deep-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-deep-teal/25 ${compact ? 'min-h-10 text-xs' : 'min-h-11 text-sm'}`}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`font-label inline-flex flex-1 items-center justify-center rounded-lg bg-deep-teal font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-50 ${compact ? 'min-h-10 text-[9px]' : 'min-h-11 text-[10px]'}`}
        >
          {pending ? (isArabic ? 'جاري…' : 'Saving…') : isArabic ? 'حفظ' : 'Notify me'}
        </button>
        <button
          type="button"
          className={`font-label inline-flex items-center justify-center rounded-lg border border-stone/50 px-3 text-[10px] uppercase tracking-[0.12em] text-clay ${compact ? 'min-h-10' : 'min-h-11'}`}
          onClick={() => setOpen(false)}
          aria-label={isArabic ? 'إلغاء' : 'Cancel'}
        >
          ×
        </button>
      </div>
      {error ? (
        <p className="font-body text-xs text-ember" role="alert">
          {isArabic ? 'أدخل بريداً صالحاً' : 'Enter a valid email'}
        </p>
      ) : null}
      <span className="sr-only">{productName}</span>
    </form>
  );
}
