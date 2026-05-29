import { getDictionary, type SupportedLocale } from "@/lib/i18n/dictionary";

export function TrustRibbon({ locale = "en" }: { locale?: SupportedLocale }) {
  const copy = getDictionary(locale);
  const items = [
    { title: copy.trust.artistMade, body: copy.trust.artistMadeBody },
    { title: copy.trust.printedEgypt, body: copy.trust.printedEgyptBody },
    { title: copy.trust.cod, body: copy.trust.codBody },
    { title: copy.trust.exchange, body: copy.trust.exchangeBody },
  ] as const;

  return (
    <section aria-label="HORO trust signals" className="grid gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-sm font-semibold text-black">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-black/60">{item.body}</p>
        </div>
      ))}
    </section>
  );
}
