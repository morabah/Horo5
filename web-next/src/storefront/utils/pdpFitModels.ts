import { PDP_SCHEMA } from '../data/domain-config';
import type { PdpFitModel, Product } from '../data/site';

const { copy } = PDP_SCHEMA;

function fitNoteSuffixFromModel(model: PdpFitModel): string {
  const note = model.fitNote?.trim();
  if (!note) return '';
  return copy.sizeGuideFitNoteSuffix.replace('{fitNote}', note);
}

export function formatPdpFitModelLine(model: PdpFitModel): string {
  return copy.sizeGuideFitModelTemplate
    .replace('{heightCm}', String(model.heightCm))
    .replace('{heightImperial}', model.heightImperial)
    .replace('{sizeWorn}', model.sizeWorn)
    .replace('{fitNoteSuffix}', fitNoteSuffixFromModel(model));
}

/**
 * Prefer a model whose `sizeWorn` matches the shopper’s chip selection.
 * When presets only list S/M models but the shopper picks L/XL, keep the reference height and
 * preset fit note but align “wearing size” with `selectedSize` so it matches the flat-measurements line.
 */
export function formatPdpFitModelLineForSizeSelection(
  models: PdpFitModel[],
  selectedSize: string | null | undefined,
): string | null {
  if (!models.length) return null;
  if (selectedSize) {
    const match = models.find((m) => m.sizeWorn === selectedSize);
    if (match) return formatPdpFitModelLine(match);
    const base = models[0]!;
    return copy.sizeGuideFitModelTemplate
      .replace('{heightCm}', String(base.heightCm))
      .replace('{heightImperial}', base.heightImperial)
      .replace('{sizeWorn}', selectedSize)
      .replace('{fitNoteSuffix}', fitNoteSuffixFromModel(base));
  }
  return formatPdpFitModelLine(models[0]!);
}

export function formatPdpFitModelLines(product: Product): string[] {
  if (!product.pdpFitModels?.length) return [];
  return product.pdpFitModels.map(formatPdpFitModelLine);
}

export function defaultPdpModelParagraph(product: Product): string {
  const fitSuffix = product.fitLabel ? ` — ${product.fitLabel.toLowerCase()} fit` : '';
  return PDP_SCHEMA.copy.modelLineTemplate.replace('{fit}', fitSuffix);
}
