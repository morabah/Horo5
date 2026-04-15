/**
 * Customer-facing order label for confirmations and messaging.
 * `display_id` is the store-scoped sequence Medusa assigns (unique per shop);
 * fall back to the internal `order.id` so the reference is always unique.
 */
export function buildHoroCustomerOrderRef(order: { id: string; display_id?: unknown }): string {
  if (typeof order.display_id === "number" && Number.isFinite(order.display_id) && order.display_id > 0) {
    return `HORO-${Math.floor(order.display_id)}`;
  }
  if (typeof order.display_id === "string") {
    const n = parseInt(order.display_id.trim(), 10);
    if (Number.isFinite(n) && n > 0) {
      return `HORO-${n}`;
    }
  }
  return order.id;
}
