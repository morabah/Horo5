"use client";

import { PolicyPageLayout } from '../components/PolicyPageLayout';
import { mergePdpSizeTableConfig, type PdpSizeTableConfig } from '../data/domain-config';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';

export function SizeGuide({ sizeTableConfig }: { sizeTableConfig?: PdpSizeTableConfig }) {
  const copy = useDictionary();
  const page = copy.pages.sizeGuide;
  const resolvedSizeTable = sizeTableConfig ?? mergePdpSizeTableConfig(undefined);
  const formatModelLine = (model: PdpSizeTableConfig['fitModels'][number]) =>
    page.modelLineTemplate
      .replace('{heightCm}', String(model.heightCm))
      .replace('{heightImperial}', model.heightImperial)
      .replace('{sizeWorn}', model.sizeWorn)
      .replace('{fitNote}', model.fitNote ? ` - ${model.fitNote}` : '');

  return (
    <PolicyPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections.map((section) => ({
        title: section.title,
        body: section.body,
      }))}
    >
      <section aria-labelledby="size-guide-table-title" className="rounded-[18px] border border-stone/45 bg-papyrus/55 p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
              {resolvedSizeTable.presetKeyUsed}
            </p>
            <h2 id="size-guide-table-title" className="font-headline mt-1 text-[1.15rem] font-semibold tracking-tight text-obsidian md:text-[1.3rem]">
              {page.tableTitle}
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left font-body text-sm text-warm-charcoal">
            <thead className="font-label text-[10px] uppercase tracking-[0.18em] text-label">
              <tr className="border-b border-stone/45">
                <th className="py-3 pr-4 font-semibold">{page.tableSize}</th>
                <th className="px-4 py-3 font-semibold">{page.tableChest}</th>
                <th className="px-4 py-3 font-semibold">{page.tableShoulder}</th>
                <th className="px-4 py-3 font-semibold">{page.tableLength}</th>
                <th className="py-3 pl-4 font-semibold">{page.tableSleeve}</th>
              </tr>
            </thead>
            <tbody>
              {resolvedSizeTable.measurements.map((row) => (
                <tr key={row.size} className="border-b border-stone/25 last:border-b-0">
                  <td className="py-3 pr-4 font-semibold text-obsidian">{row.size}</td>
                  <td className="px-4 py-3">{row.chest}</td>
                  <td className="px-4 py-3">{row.shoulder}</td>
                  <td className="px-4 py-3">{row.length}</td>
                  <td className="py-3 pl-4">{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {resolvedSizeTable.fitModels.length > 0 ? (
          <div className="mt-5 space-y-2">
            {resolvedSizeTable.fitModels.map((model) => (
              <p key={`${model.heightCm}-${model.sizeWorn}-${model.fitNote ?? ''}`} className="font-body text-sm leading-relaxed text-warm-charcoal">
                {formatModelLine(model)}
              </p>
            ))}
          </div>
        ) : null}
      </section>
    </PolicyPageLayout>
  );
}
