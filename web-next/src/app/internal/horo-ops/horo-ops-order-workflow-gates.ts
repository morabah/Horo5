/** Pure Medusa order-graph gates for HORO ops workflows (mirrors dialog logic; testable without React). */

const CAPTURE_ELIGIBLE = new Set(["authorized", "pending", "requires_capture", "awaiting"]);

const ORDER_CAPTURE_ELIGIBLE = new Set([
  "authorized",
  "awaiting",
  "partially_authorized",
  "requires_action",
]);

export const DELIVERED_LIKE_FULFILLMENT = new Set(["fulfilled", "shipped", "delivered", "partially_delivered"]);
const FULFILLMENT_CREATE_BLOCKED = new Set(["canceled", "cancelled"]);

const PAYMENT_STATUS_CAPTURED = new Set(["captured", "partially_captured", "completed"]);

export function isPaymentStatusCapturedForFulfillment(ps: unknown): boolean {
  return typeof ps === "string" && PAYMENT_STATUS_CAPTURED.has(ps.toLowerCase());
}

/** Matches medusa-backend `orderUsesInstapayPayment` (payment_sessions / payments provider_id). */
export function orderUsesInstapayGraph(g: Record<string, unknown>): boolean {
  const cols = g.payment_collections;
  if (!Array.isArray(cols)) return false;
  for (const c of cols) {
    if (!c || typeof c !== "object") continue;
    const rec = c as Record<string, unknown>;
    const sessions = rec.payment_sessions;
    if (Array.isArray(sessions)) {
      for (const s of sessions) {
        if (!s || typeof s !== "object") continue;
        const pid = (s as Record<string, unknown>).provider_id;
        if (typeof pid === "string" && pid.toLowerCase().includes("instapay")) return true;
      }
    }
    const payments = rec.payments;
    if (Array.isArray(payments)) {
      for (const p of payments) {
        if (!p || typeof p !== "object") continue;
        const pid = (p as Record<string, unknown>).provider_id;
        if (typeof pid === "string" && pid.toLowerCase().includes("instapay")) return true;
      }
    }
  }
  return false;
}

export function canCapturePayment(g: Record<string, unknown> | null): boolean {
  if (!g) return false;
  const cols = g.payment_collections;
  if (Array.isArray(cols)) {
    for (const c of cols) {
      if (!c || typeof c !== "object") continue;
      const payments = (c as Record<string, unknown>).payments;
      if (!Array.isArray(payments)) continue;
      for (const p of payments) {
        if (!p || typeof p !== "object") continue;
        const st =
          typeof (p as Record<string, unknown>).status === "string"
            ? String((p as Record<string, unknown>).status).toLowerCase()
            : "";
        if (CAPTURE_ELIGIBLE.has(st)) return true;
      }
    }
  }
  const ps = typeof g.payment_status === "string" ? g.payment_status.toLowerCase() : "";
  if (ps && ORDER_CAPTURE_ELIGIBLE.has(ps)) return true;
  if (orderUsesInstapayGraph(g) && !isPaymentStatusCapturedForFulfillment(g.payment_status)) {
    const os = typeof g.status === "string" ? g.status.toLowerCase() : "";
    if (os !== "canceled" && os !== "cancelled") return true;
  }
  return false;
}

function hasOrderLineItems(g: Record<string, unknown>): boolean {
  const items = g.items;
  if (!Array.isArray(items)) return false;
  return items.some((it) => it && typeof it === "object");
}

export function canCreateFulfillment(g: Record<string, unknown> | null): boolean {
  if (!g) return false;
  if (orderUsesInstapayGraph(g) && !isPaymentStatusCapturedForFulfillment(g.payment_status)) {
    return false;
  }
  const fs = String(g.fulfillment_status ?? "").toLowerCase();
  if (fs && FULFILLMENT_CREATE_BLOCKED.has(fs)) return false;
  if (fs === "not_fulfilled" || fs === "partially_fulfilled" || fs === "pending") return true;
  if (!fs && hasOrderLineItems(g)) return true;
  if (fs && !DELIVERED_LIKE_FULFILLMENT.has(fs) && hasOrderLineItems(g)) return true;
  return false;
}

export function canMarkFulfillmentDelivered(g: Record<string, unknown> | null): boolean {
  if (!g) return false;
  const fuls = g.fulfillments;
  if (!Array.isArray(fuls)) return false;
  return fuls.some((f) => {
    if (!f || typeof f !== "object") return false;
    const d = (f as Record<string, unknown>).delivered_at;
    return d === null || d === undefined || (typeof d === "string" && d.trim() === "");
  });
}

export type OpsWorkflowAction = "capture_payment" | "create_fulfillment" | "mark_fulfillment_delivered";

/** First eligible workflow in pipeline order. */
export function resolveNextOpsAction(g: Record<string, unknown> | null): OpsWorkflowAction | null {
  if (!g) return null;
  if (canCapturePayment(g)) return "capture_payment";
  if (canCreateFulfillment(g)) return "create_fulfillment";
  if (canMarkFulfillmentDelivered(g)) return "mark_fulfillment_delivered";
  return null;
}

export type PipelineStepState = "done" | "current" | "pending";

export function getPipelineSteps(g: Record<string, unknown> | null): {
  payment: PipelineStepState;
  fulfillment: PipelineStepState;
  delivery: PipelineStepState;
} {
  if (!g) {
    return { payment: "pending", fulfillment: "pending", delivery: "pending" };
  }
  if (canCapturePayment(g)) {
    return { payment: "current", fulfillment: "pending", delivery: "pending" };
  }
  if (canCreateFulfillment(g)) {
    return { payment: "done", fulfillment: "current", delivery: "pending" };
  }
  if (canMarkFulfillmentDelivered(g)) {
    return { payment: "done", fulfillment: "done", delivery: "current" };
  }
  const fs = String(g.fulfillment_status ?? "").toLowerCase();
  const deliveredLike = Boolean(fs && DELIVERED_LIKE_FULFILLMENT.has(fs));
  if (deliveredLike) {
    return { payment: "done", fulfillment: "done", delivery: "done" };
  }
  if (!canCapturePayment(g) && !canCreateFulfillment(g) && !canMarkFulfillmentDelivered(g)) {
    return {
      payment: isPaymentStatusCapturedForFulfillment(g.payment_status) ? "done" : "pending",
      fulfillment: deliveredLike ? "done" : "pending",
      delivery: deliveredLike ? "done" : "pending",
    };
  }
  return {
    payment: isPaymentStatusCapturedForFulfillment(g.payment_status) ? "done" : "pending",
    fulfillment: "pending",
    delivery: "pending",
  };
}

export function formatOrderTotalForUi(currency: string | null | undefined, total: unknown): string {
  const code = (currency || "—").toUpperCase();
  let n = 0;
  if (typeof total === "number" && Number.isFinite(total)) n = Math.round(total);
  else if (typeof total === "string") {
    const p = parseFloat(total);
    n = Number.isFinite(p) ? Math.round(p) : 0;
  } else if (total && typeof total === "object" && "numeric_" in (total as object)) {
    const v = (total as { numeric_?: unknown }).numeric_;
    if (typeof v === "number" && Number.isFinite(v)) n = Math.round(v);
  }
  return `${n.toLocaleString()} ${code}`;
}

export function workflowDisabledReason(
  g: Record<string, unknown> | null,
  action: OpsWorkflowAction,
): string | null {
  if (!g) return "Order not loaded.";
  if (action === "capture_payment") {
    if (canCapturePayment(g)) return null;
    return "No payment is waiting for capture.";
  }
  if (action === "create_fulfillment") {
    if (canCreateFulfillment(g)) return null;
    if (orderUsesInstapayGraph(g) && !isPaymentStatusCapturedForFulfillment(g.payment_status)) {
      return "Waiting on InstaPay capture before fulfillment.";
    }
    const fs = String(g.fulfillment_status ?? "").toLowerCase();
    if (fs && FULFILLMENT_CREATE_BLOCKED.has(fs)) return "Order is canceled.";
    if (DELIVERED_LIKE_FULFILLMENT.has(fs)) return "Fulfillment already completed.";
    return "Nothing to fulfill right now.";
  }
  if (action === "mark_fulfillment_delivered") {
    if (canMarkFulfillmentDelivered(g)) return null;
    return "No fulfillment is waiting to be marked delivered.";
  }
  return null;
}
