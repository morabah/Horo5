export type CartStockBlockReason = 'out_of_stock' | 'stock_limit' | 'unavailable';

export type CartMutationResult =
  | {
      ok: true;
      qty: number;
      limit: number | null;
    }
  | {
      ok: false;
      reason: CartStockBlockReason;
      limit: number | null;
      currentQty: number;
      requestedQty: number;
    };

export function formatCartStockMessage(
  result: CartMutationResult,
  productName: string,
  isArabic: boolean,
): string {
  if (result.ok) return '';

  const name = productName.trim() || (isArabic ? 'هذا المنتج' : 'This item');
  if (result.reason === 'out_of_stock' || result.limit === 0) {
    return isArabic
      ? `${name} غير متوفر حالياً بهذا المقاس.`
      : `${name} is out of stock in this size.`;
  }

  if (typeof result.limit === 'number') {
    return isArabic
      ? `المتوفر من ${name} هو ${result.limit} فقط بهذا المقاس.`
      : `Only ${result.limit} left for ${name} in this size.`;
  }

  return isArabic
    ? `${name} غير متاح حالياً بهذا المقاس.`
    : `${name} is unavailable in this size.`;
}
