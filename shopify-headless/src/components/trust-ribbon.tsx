const TRUST_ITEMS = [
  { title: "Artist-made", body: "Original artwork, not stock-print filler." },
  { title: "Printed in Egypt", body: "Local production and clearer turnaround." },
  { title: "COD available", body: "Cash on delivery when enabled in checkout." },
  { title: "14-day exchange", body: "An easier path if the fit is off." },
] as const;

export function TrustRibbon() {
  return (
    <section aria-label="HORO trust signals" className="grid gap-3 md:grid-cols-4">
      {TRUST_ITEMS.map((item) => (
        <div key={item.title} className="rounded-lg border border-black/10 bg-white p-4">
          <p className="text-sm font-semibold text-black">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-black/60">{item.body}</p>
        </div>
      ))}
    </section>
  );
}
