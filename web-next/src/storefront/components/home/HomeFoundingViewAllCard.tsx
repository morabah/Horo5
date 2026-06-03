import Link from 'next/link';

export function HomeFoundingViewAllCard({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="home-founding-card home-founding-card--view-all flex h-full min-h-0 flex-col overflow-hidden rounded-[4px] bg-horo-soft shadow-[0_1px_0_rgba(79,17,31,0.04)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,17,31,0.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horo-pulse"
    >
      <div className="home-founding-card__view-all-inner flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="font-headline text-[15px] font-semibold leading-snug text-horo-pulse">{label}</span>
        <span className="font-body text-[12px] font-semibold text-horo-root/80" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
