/** Pure helpers for horo-ops dashboard tables (unit-tested). */

export type SortKey = "ref" | "total" | "created" | "sla";
export type SortDir = "asc" | "desc";

export type PayFilter = "all" | "captured" | "pending" | "failed";
export type FulfillFilter = "all" | "not_fulfilled" | "partial" | "fulfilled";

export type SummarizedOrderLike = {
  id: string;
  display_id?: number | string | null;
  friendly?: string | null;
  email?: string | null;
  created_at?: string;
  total?: unknown;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  sla_deadline_day_utc?: string | null;
};

const CAPTURED_PAY = new Set(["captured", "partially_captured", "completed"]);
const PENDING_PAY = new Set([
  "pending",
  "awaiting",
  "authorized",
  "partially_authorized",
  "requires_action",
  "requires_capture",
]);
const FAILED_PAY = new Set(["failed", "canceled", "cancelled", "error"]);

function parseTotal(total: unknown): number {
  if (typeof total === "number" && Number.isFinite(total)) return total;
  if (typeof total === "string") {
    const n = parseFloat(total);
    return Number.isFinite(n) ? n : 0;
  }
  if (total && typeof total === "object" && "numeric_" in (total as object)) {
    const v = (total as { numeric_?: unknown }).numeric_;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function refSortKey(row: SummarizedOrderLike): string {
  if (row.friendly) return row.friendly;
  if (typeof row.display_id === "number" && row.display_id > 0) return String(Math.floor(row.display_id)).padStart(8, "0");
  if (typeof row.display_id === "string") {
    const n = parseInt(row.display_id.trim(), 10);
    if (Number.isFinite(n) && n > 0) return String(n).padStart(8, "0");
  }
  return row.id;
}

export function sortSummarizedOrders<T extends SummarizedOrderLike>(rows: T[], key: SortKey, dir: SortDir): T[] {
  const mul = dir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (key === "total") {
      return (parseTotal(a.total) - parseTotal(b.total)) * mul;
    }
    if (key === "created") {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return (ta - tb) * mul;
    }
    if (key === "sla") {
      const sa = a.sla_deadline_day_utc || "";
      const sb = b.sla_deadline_day_utc || "";
      return sa.localeCompare(sb) * mul;
    }
    return refSortKey(a).localeCompare(refSortKey(b)) * mul;
  });
  return copy;
}

export function filterOrdersByPaymentChip<T extends SummarizedOrderLike>(rows: T[], chip: PayFilter): T[] {
  if (chip === "all") return rows;
  return rows.filter((r) => {
    const ps = (r.payment_status || "").toLowerCase();
    if (chip === "captured") return CAPTURED_PAY.has(ps);
    if (chip === "pending") return PENDING_PAY.has(ps) || ps === "";
    if (chip === "failed") return FAILED_PAY.has(ps);
    return true;
  });
}

export function filterOrdersByFulfillmentChip<T extends SummarizedOrderLike>(rows: T[], chip: FulfillFilter): T[] {
  if (chip === "all") return rows;
  return rows.filter((r) => {
    const fs = (r.fulfillment_status || "").toLowerCase();
    if (chip === "not_fulfilled") return fs === "not_fulfilled" || fs === "" || fs === "pending";
    if (chip === "partial") return fs === "partially_fulfilled" || fs === "partially_shipped" || fs === "partially_delivered";
    if (chip === "fulfilled") return fs === "fulfilled" || fs === "shipped" || fs === "delivered";
    return true;
  });
}

function namePart(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Display name from Medusa order graph (shipping_address preferred). */
export function customerDisplayNameFromGraph(graph: Record<string, unknown> | undefined | null): string {
  if (!graph) return "";
  const ship = graph.shipping_address;
  const bill = graph.billing_address;
  for (const addr of [ship, bill]) {
    if (!addr || typeof addr !== "object" || Array.isArray(addr)) continue;
    const rec = addr as Record<string, unknown>;
    const fn = namePart(rec.first_name);
    const ln = namePart(rec.last_name);
    const combined = [fn, ln].filter(Boolean).join(" ").trim();
    if (combined) return combined;
  }
  return "";
}

export function metadataBadgeValues(meta: Record<string, unknown> | null | undefined): {
  horo_ops_handling?: string;
  whatsapp_opt_in?: string;
  delivery_window?: string;
} {
  if (!meta) return {};
  const g = (k: string) => {
    const v = meta[k];
    if (typeof v === "string") return v;
    if (typeof v === "boolean") return v ? "yes" : "no";
    if (v != null && typeof v !== "object") return String(v);
    return undefined;
  };
  return {
    horo_ops_handling: g("horo_ops_handling"),
    whatsapp_opt_in: g("whatsapp_opt_in"),
    delivery_window: g("delivery_window"),
  };
}
