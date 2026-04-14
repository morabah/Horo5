import { PDP_SCHEMA } from '../data/domain-config';
import type { PdpFitModel, Product } from '../data/site';

export function formatPdpFitModelLine(model: PdpFitModel): string {
  const tail = model.fitNote ? ` — ${model.fitNote}` : '';
  return `Model is ${model.heightCm} cm / ${model.heightImperial}, wearing size ${model.sizeWorn}${tail}.`;
}

export function formatPdpFitModelLines(product: Product): string[] {
  if (!product.pdpFitModels?.length) return [];
  return product.pdpFitModels.map(formatPdpFitModelLine);
}

export function defaultPdpModelParagraph(product: Product): string {
  const fitSuffix = product.fitLabel ? ` — ${product.fitLabel.toLowerCase()} fit` : '';
  return PDP_SCHEMA.copy.modelLineTemplate.replace('{fit}', fitSuffix);
}
