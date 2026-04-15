"use client";

import { useCallback, useEffect, useState } from "react";

import {
  formatOrderTotalForUi,
  getPipelineSteps,
  type OpsWorkflowAction,
  resolveNextOpsAction,
  workflowDisabledReason,
} from "./horo-ops-order-workflow-gates";
import { useHoroOpsToastStrict } from "./horo-ops-toast";

export type OpsOrderSummaryRow = {
  id: string;
  display_id?: number | string | null;
  friendly?: string | null;
  email?: string | null;
  currency_code?: string | null;
  total?: unknown;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  sla_deadline_day_utc?: string | null;
};

export const MEDUSA_ORDER_STATUS_OPTIONS = [
  "pending",
  "completed",
  "draft",
  "archived",
  "canceled",
  "requires_action",
] as const;

type Props = {
  open: boolean;
  orderId: string | null;
  summary: OpsOrderSummaryRow | null;
  /** From dashboard `order_graphs` when include_graph was on; otherwise fetched on open. */
  initialGraph?: Record<string, unknown> | null;
  onClose: () => void;
  onSaved: () => void;
};

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-neutral-100 p-3 text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function metaString(meta: unknown, key: string): string {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "";
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function PipelineTracker({
  payment,
  fulfillment,
  delivery,
}: {
  payment: "done" | "current" | "pending";
  fulfillment: "done" | "current" | "pending";
  delivery: "done" | "current" | "pending";
}) {
  const pill = (label: string, state: "done" | "current" | "pending") => {
    const base = "rounded-full px-3 py-1 text-xs font-medium ring-1 ";
    if (state === "done") return `${base} bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800`;
    if (state === "current")
      return `${base} bg-amber-100 text-amber-950 ring-amber-300 dark:bg-amber-950 dark:text-amber-50 dark:ring-amber-700`;
    return `${base} bg-neutral-100 text-neutral-500 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700`;
  };
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Order pipeline">
      <span className={pill("Payment", payment)}>Payment</span>
      <span className="text-neutral-400" aria-hidden>
        →
      </span>
      <span className={pill("Fulfillment", fulfillment)}>Fulfillment</span>
      <span className="text-neutral-400" aria-hidden>
        →
      </span>
      <span className={pill("Delivered", delivery)}>Delivered</span>
    </div>
  );
}

function formatEmailForPrimaryLabel(email: string): string {
  const t = email.trim();
  if (t.length <= 26) return t;
  const at = t.indexOf("@");
  if (at <= 0 || at >= t.length - 1) return `${t.slice(0, 20)}…`;
  const user = t.slice(0, at);
  const dom = t.slice(at + 1);
  const u = user.length > 8 ? `${user.slice(0, 6)}…` : user;
  const d = dom.length > 14 ? `${dom.slice(0, 12)}…` : dom;
  return `${u}@${d}`;
}

function WorkflowLeadIcon({ action }: { action: OpsWorkflowAction }) {
  const cls = "mr-2 h-5 w-5 shrink-0 text-current";
  if (action === "capture_payment") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2.5" y="6.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 10.5h19" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="14" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (action === "create_fulfillment") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 8h16v11H4z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 8V6.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l3.5 3.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function primaryActionClasses(action: OpsWorkflowAction): string {
  const base =
    "inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950 ";
  if (action === "capture_payment")
    return `${base} bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500`;
  if (action === "create_fulfillment")
    return `${base} bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500`;
  return `${base} bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500`;
}

function actionVerb(action: OpsWorkflowAction): string {
  if (action === "capture_payment") return "Capture payment";
  if (action === "create_fulfillment") return "Create fulfillment";
  return "Mark fulfillment delivered";
}

export function HoroOpsOrderDetailDialog({ open, orderId, summary, initialGraph, onClose, onSaved }: Props) {
  const { showToast } = useHoroOpsToastStrict();
  const [graph, setGraph] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [medusaStatus, setMedusaStatus] = useState<string>("pending");
  const [opsHandling, setOpsHandling] = useState<string>("");
  const [initialMedusaStatus, setInitialMedusaStatus] = useState<string>("pending");
  const [initialOpsHandling, setInitialOpsHandling] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);

  const resetFromGraph = useCallback((g: Record<string, unknown> | null) => {
    if (!g) return;
    const st = typeof g.status === "string" ? g.status : "pending";
    const nextStatus = MEDUSA_ORDER_STATUS_OPTIONS.includes(st as (typeof MEDUSA_ORDER_STATUS_OPTIONS)[number])
      ? st
      : "pending";
    setMedusaStatus(nextStatus);
    setInitialMedusaStatus(nextStatus);
    const h = metaString(g.metadata, "horo_ops_handling");
    const nextHandling = h === "pending" || h === "received" || h === "collected" ? h : "";
    setOpsHandling(nextHandling);
    setInitialOpsHandling(nextHandling);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !orderId) {
      setGraph(null);
      setLoadError(null);
      setSaveError(null);
      setWorkflowError(null);
      return;
    }
    setSaveError(null);
    setWorkflowError(null);
    /** Dashboard `order_graphs` omits payment_collections / fulfillments — do not treat it as the action graph. */
    setGraph(null);
    if (initialGraph && Object.keys(initialGraph).length > 0) {
      resetFromGraph(initialGraph);
    }

    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/horo-ops/order?order_id=${encodeURIComponent(orderId)}`, { credentials: "include" });
        const text = await res.text();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(text || res.statusText);
          if (!initialGraph || Object.keys(initialGraph).length === 0) setGraph(null);
          return;
        }
        const parsed = JSON.parse(text) as { order?: Record<string, unknown> };
        const o = parsed.order ?? null;
        setGraph(o);
        if (o) resetFromGraph(o);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load order");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, orderId, initialGraph, resetFromGraph]);

  const save = async () => {
    if (!orderId) return;
    setSaving(true);
    setSaveError(null);
    setWorkflowError(null);
    try {
      const body: Record<string, unknown> = { order_id: orderId };
      if (medusaStatus !== initialMedusaStatus) {
        body.status = medusaStatus;
      }
      if (opsHandling !== initialOpsHandling) {
        body.horo_ops_handling = opsHandling === "" ? null : opsHandling;
      }
      if (Object.keys(body).length === 1) {
        setSaveError("No changes to save.");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/horo-ops/order/update", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) {
        setSaveError(text || res.statusText);
        return;
      }
      const parsed = JSON.parse(text) as { order?: Record<string, unknown> | null };
      if (parsed.order) {
        setGraph(parsed.order);
        resetFromGraph(parsed.order);
      }
      showToast("Saved to Medusa.", "success");
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async (action: OpsWorkflowAction) => {
    if (!orderId) return;
    setActionBusy(action);
    setWorkflowError(null);
    try {
      const res = await fetch("/api/horo-ops/order/action", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderId, action }),
      });
      const text = await res.text();
      if (!res.ok) {
        setWorkflowError(text || res.statusText);
        showToast("Workflow action failed.", "error");
        return;
      }
      const parsed = JSON.parse(text) as { order?: Record<string, unknown> | null };
      if (parsed.order) {
        setGraph(parsed.order);
        resetFromGraph(parsed.order);
      }
      showToast(`${actionVerb(action)} completed.`, "success");
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed";
      setWorkflowError(msg);
      showToast(msg, "error");
    } finally {
      setActionBusy(null);
    }
  };

  if (!open || !orderId) return null;

  const displayRef =
    summary?.friendly ||
    (typeof summary?.display_id === "number" && summary.display_id > 0
      ? `HORO-${Math.floor(summary.display_id)}`
      : orderId);

  const nextAction = graph && !loadError ? resolveNextOpsAction(graph) : null;
  const steps = graph && !loadError ? getPipelineSteps(graph) : null;
  const currency =
    (graph && typeof graph.currency_code === "string" ? graph.currency_code : null) ?? summary?.currency_code ?? null;
  const total = graph?.total ?? summary?.total;
  const moneyLine = graph ? formatOrderTotalForUi(currency, total) : "";
  const emailHint = summary?.email ? formatEmailForPrimaryLabel(summary.email) : "customer";

  const primaryLabel =
    nextAction && graph
      ? nextAction === "capture_payment"
        ? `Capture ${moneyLine || "payment"} from ${emailHint}`
        : nextAction === "create_fulfillment"
          ? `Create fulfillment (${moneyLine || "order"})`
          : "Mark fulfillment delivered"
      : "No workflow action right now";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="horo-ops-order-detail-title"
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <div title={`Medusa order id: ${orderId}`}>
              <h2 id="horo-ops-order-detail-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Order {displayRef}
              </h2>
              <span className="sr-only">Medusa order id: {orderId}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-800 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus-visible:ring-offset-neutral-950"
            >
              Close
            </button>
          </div>
          {workflowError ? (
            <p
              className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
              role="alert"
            >
              {workflowError}
            </p>
          ) : null}
        </div>

        <div className="space-y-5 px-4 py-4">
          {loadError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert">
              {loadError}
            </p>
          ) : null}

          {!loadError && !graph ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading full order graph for Medusa workflows…</p>
          ) : null}

          {summary ? (
            <div className="grid gap-2 text-sm text-neutral-700 dark:text-neutral-300 sm:grid-cols-2">
              <p>
                <span className="text-neutral-500">Email:</span> {summary.email || "—"}
              </p>
              <p>
                <span className="text-neutral-500">Payment:</span> {summary.payment_status || "—"}
              </p>
              <p>
                <span className="text-neutral-500">Fulfillment:</span> {summary.fulfillment_status || "—"}
              </p>
              <p>
                <span className="text-neutral-500">SLA day (UTC):</span> {summary.sla_deadline_day_utc || "—"}
              </p>
            </div>
          ) : null}

          {graph && steps ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">Pipeline</p>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Based on the loaded Medusa order graph (payment collections and fulfillments).
              </p>
              <div className="mt-3">
                <PipelineTracker payment={steps.payment} fulfillment={steps.fulfillment} delivery={steps.delivery} />
              </div>
            </div>
          ) : null}

          {graph ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-sm dark:border-violet-900/50 dark:bg-violet-950/30">
              <p className="text-base font-medium text-violet-950 dark:text-violet-100">Medusa workflows</p>
              <p className="mt-1 text-xs text-violet-950/90 dark:text-violet-100/90">
                These call the same Medusa workflows as Admin. One primary action matches the next step in the pipeline.
              </p>

              <div className="mt-4 space-y-2">
                {nextAction ? (
                  <button
                    type="button"
                    disabled={!!loadError || !!actionBusy || saving}
                    onClick={() => void runWorkflow(nextAction)}
                    className={primaryActionClasses(nextAction)}
                  >
                    <WorkflowLeadIcon action={nextAction} />
                    {actionBusy === nextAction ? "Working…" : primaryLabel}
                  </button>
                ) : (
                  <p className="text-xs text-violet-900 dark:text-violet-200">No capture, fulfillment, or mark-delivered action applies to this order right now.</p>
                )}
                <div className="flex flex-col gap-2 pt-1">
                  {(["capture_payment", "create_fulfillment", "mark_fulfillment_delivered"] as const).map((a) => {
                    if (a === nextAction) return null;
                    const reason = workflowDisabledReason(graph, a);
                    const enabled = !loadError && !actionBusy && !saving && reason === null;
                    return (
                      <button
                        key={a}
                        type="button"
                        disabled={!enabled}
                        title={reason ?? undefined}
                        onClick={() => void runWorkflow(a)}
                        className="w-full rounded-md border border-neutral-200/80 bg-transparent px-3 py-2 text-left text-xs text-violet-900 hover:bg-violet-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-violet-100 dark:hover:bg-violet-900/40 dark:focus-visible:ring-offset-neutral-950"
                      >
                        <span className="font-medium">{actionVerb(a)}</span>
                        {reason ? <span className="mt-0.5 block text-neutral-600 dark:text-neutral-400">— {reason}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              <details className="mt-3 rounded-md border border-violet-300/80 bg-white/90 px-3 py-2 text-xs text-violet-950/95 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100/90">
                <summary className="cursor-pointer font-medium text-violet-950 dark:text-violet-100">
                  Where this order appears on the dashboard (after refresh)
                </summary>
                <p className="mt-2 text-[11px] leading-snug text-violet-900/90 dark:text-violet-200/85">
                  Main buckets use Medusa <strong>payment</strong> and <strong>fulfillment</strong> (plus SLA dates)—not <strong>order status</strong> or
                  fulfillment-desk metadata. <strong>Order list</strong> always includes every loaded order.
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-snug">
                  <li>
                    <strong>Capture payment</strong> — When captured: drops off <strong>Instapay — awaiting capture</strong> (if Instapay); joins{" "}
                    <strong>Instapay — ready to ship</strong> until fulfillment is delivered-like; joins <strong>Money collected</strong>.
                  </li>
                  <li>
                    <strong>Create fulfillment</strong> — Instapay + captured: stays on <strong>Instapay — ready to ship</strong> until delivered-like.
                  </li>
                  <li>
                    <strong>Mark fulfillment delivered</strong> — When delivered-like: leaves <strong>Instapay — ready to ship</strong> and SLA delivery buckets;
                    may appear in <strong>Delivered recently</strong>.
                  </li>
                </ul>
              </details>
            </div>
          ) : null}

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Medusa order status</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Database enum only (not custom labels). Typical flow: <code className="rounded bg-white px-1 dark:bg-neutral-950">pending</code> →{" "}
              <code className="rounded bg-white px-1 dark:bg-neutral-950">completed</code> when the order is done.
            </p>
            <label className="mt-3 block text-sm">
              <span className="sr-only">Order status</span>
              <select
                value={medusaStatus}
                onChange={(e) => setMedusaStatus(e.target.value)}
                className="mt-1 w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
              >
                {MEDUSA_ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <details className="mt-3 rounded-md border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950/60 dark:text-neutral-400">
              <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">Operator guide: order status</summary>
              <ul className="mt-2 list-disc space-y-1.5 pl-4">
                <li>
                  <strong>pending</strong> — Default for live storefront orders still in your pipeline (payment may or may not be captured yet).
                </li>
                <li>
                  <strong>completed</strong> — Commerce-complete: nothing else to do in Medusa for this order (often after payment is settled and fulfillment is done).
                </li>
                <li>
                  <strong>draft</strong> — Incomplete or non-production order; rarely change to this from ops for real checkouts.
                </li>
                <li>
                  <strong>archived</strong> — Park the order out of active work without treating it as canceled.
                </li>
                <li>
                  <strong>canceled</strong> — Void the sale; do not fulfill.
                </li>
                <li>
                  <strong>requires_action</strong> — Blocked until something external is fixed.
                </li>
              </ul>
            </details>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Ops handling (metadata)</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Stored as <code className="rounded bg-white px-1 dark:bg-neutral-950">metadata.horo_ops_handling</code>. Shown on the buyer confirmation page after
              refresh.
            </p>
            <label className="mt-3 block text-sm">
              <span className="sr-only">Handling status</span>
              <select
                value={opsHandling}
                onChange={(e) => setOpsHandling(e.target.value)}
                className="mt-1 w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
              >
                <option value="">— Not set (clear)</option>
                <option value="pending">pending</option>
                <option value="received">received</option>
                <option value="collected">collected</option>
              </select>
            </label>
          </div>

          {saveError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || !!loadError || !!actionBusy}
              onClick={() => void save()}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {saving ? "Saving…" : "Save to Medusa"}
            </button>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-sm text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {showRaw ? "Hide" : "Show"} full order JSON
            </button>
          </div>

          {showRaw && graph ? <JsonBlock data={graph} /> : null}
        </div>
      </div>
    </div>
  );
}
