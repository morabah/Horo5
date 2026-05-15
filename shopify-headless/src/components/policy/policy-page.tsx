type PolicySection = {
  title: string;
  body: string;
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
};

export function PolicyPage({ eyebrow, title, intro, sections }: PolicyPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-bold">{title}</h1>
      <p className="mt-4 text-base leading-7 text-black/70">{intro}</p>
      <div className="mt-8 space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/68">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
