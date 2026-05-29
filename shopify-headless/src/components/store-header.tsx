import Link from "next/link";

import { getDictionary, type SupportedLocale } from "@/lib/i18n/dictionary";

export function StoreHeader({ locale = "en" }: { locale?: SupportedLocale }) {
  const copy = getDictionary(locale);
  return (
    <header className="border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          HORO
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-black/70">
          <Link href="/">{copy.nav.home}</Link>
          <Link href="/products">{copy.nav.shop}</Link>
          <Link href="/feelings">{copy.nav.feelings}</Link>
          <Link href="/occasions">{copy.nav.occasions}</Link>
          <Link href="/gifts">{copy.nav.gifts}</Link>
          <Link href="/cart">{copy.nav.cart}</Link>
        </nav>
      </div>
    </header>
  );
}
