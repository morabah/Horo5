import { formatEgp } from '../utils/formatPrice';

function parseCredit(metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.loyaltyCreditEgp;
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : 0;
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

export function LoyaltyCreditBanner({
  customerMetadata = null,
  isArabic = false,
}: {
  customerMetadata?: Record<string, unknown> | null;
  isArabic?: boolean;
}) {
  const creditEgp = parseCredit(customerMetadata);
  if (creditEgp <= 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-deep-teal/25 bg-white/80 p-5">
      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-deep-teal">
        {isArabic ? 'رصيد HORO' : 'HORO credit'}
      </p>
      <p className="mt-2 font-body text-sm text-obsidian">
        {isArabic
          ? `لديك ${formatEgp(creditEgp)} جاهزة لطلبك القادم.`
          : `You have ${formatEgp(creditEgp)} ready for your next order.`}
      </p>
    </div>
  );
}
