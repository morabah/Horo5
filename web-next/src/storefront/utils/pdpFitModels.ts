import { PDP_SCHEMA } from '../data/domain-config';
import type { PdpFitModel, Product } from '../data/site';

export function formatPdpFitModelLine(model: PdpFitModel): string {
  const tail = model.fitNote ? ` — ${model.fitNote}` : '';
  return `Model is ${model.heightCm} cm / ${model.heightImperial}, wearing size ${model.sizeWorn}${tail}.`;
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
    const tail = base.fitNote ? ` — ${base.fitNote}` : '';
    return `Model is ${base.heightCm} cm / ${base.heightImperial}, wearing size ${selectedSize}${tail}.`;
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
