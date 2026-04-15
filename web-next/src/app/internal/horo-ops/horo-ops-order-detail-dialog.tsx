"use client";

import { useCallback, useEffect, useState } from "react";

export type OpsOrderSummaryRow = {
  id: string;
  display_id?: number | string | null;
  friendly?: string | null;
  email?: string | null;
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

const CAPTURE_ELIGIBLE = new Set(["authorized", "pending", "requires_capture"]);

function canCapturePayment(g: Record<string, unknown> | null): boolean {
  if (!g) return false;
  const cols = g.payment_collections;
  if (!Array.isArray(cols)) return false;
  for (const c of cols) {
    if (!c || typeof c !== "object") continue;
    const payments = (c as Record<string, unknown>).payments;
    if (!Array.isArray(payments)) continue;
    for (const p of payments) {
      if (!p || typeof p !== "object") continue;
      const st = typeof (p as Record<string, unknown>).status === "string" ? String((p as Record<string, unknown>).status).toLowerCase() : "";
      if (CAPTURE_ELIGIBLE.has(st)) return true;
    }
  }
  return false;
}

function canCreateFulfillment(g: Record<string, unknown> | null): boolean {
  if (!g) return false;
  const fs = String(g.fulfillment_status ?? "").toLowerCase();
  return fs === "not_fulfilled" || fs === "partially_fulfilled";
}

function canMarkFulfillmentDelivered(g: Record<string, unknown> | null): boolean {
  if (!g) return false;
  const fuls = g.fulfillments;
  if (!Array.isArray(fuls)) return false;
  return fuls.some((f) => {
    if (!f || typeof f !== "object") return false;
    const d = (f as Record<string, unknown>).delivered_at;
    return d === null || d === undefined || (typeof d === "string" && d.trim() === "");
  });
}

export function HoroOpsOrderDetailDialog({ open, orderId, summary, initialGraph, onClose, onSaved }: Props) {
  const [graph, setGraph] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      return;
    }
    setSaveError(null);

    if (initialGraph && Object.keys(initialGraph).length > 0) {
      setGraph(initialGraph);
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
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async (action: "capture_payment" | "create_fulfillment" | "mark_fulfillment_delivered") => {
    if (!orderId) return;
    setActionBusy(action);
    setSaveError(null);
    try {
      const res = await fetch("/api/horo-ops/order/action", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderId, action }),
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
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Action failed");
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
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <h2 id="horo-ops-order-detail-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Order {displayRef}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-neutral-500 dark:text-neutral-400">{orderId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 px-4 py-4">
          {loadError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert">
              {loadError}
            </p>
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

          {graph ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-sm dark:border-violet-900/50 dark:bg-violet-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">Medusa workflows</p>
              <p className="mt-1 text-xs text-violet-950/90 dark:text-violet-100/90">
                These call the same Medusa workflows as Admin: <strong>capture payment</strong>, <strong>create fulfillment</strong>, and{" "}
                <strong>mark fulfillment delivered</strong>. They update payment and fulfillment state—not only JSON metadata.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!!loadError || !!actionBusy || saving || !canCapturePayment(graph)}
                  onClick={() => void runWorkflow("capture_payment")}
                  className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-50 dark:hover:bg-violet-900"
                >
                  {actionBusy === "capture_payment" ? "Capturing…" : "Capture payment"}
                </button>
                <button
                  type="button"
                  disabled={!!loadError || !!actionBusy || saving || !canCreateFulfillment(graph)}
                  onClick={() => void runWorkflow("create_fulfillment")}
                  className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-50 dark:hover:bg-violet-900"
                >
                  {actionBusy === "create_fulfillment" ? "Creating…" : "Create fulfillment"}
                </button>
                <button
                  type="button"
                  disabled={!!loadError || !!actionBusy || saving || !canMarkFulfillmentDelivered(graph)}
                  onClick={() => void runWorkflow("mark_fulfillment_delivered")}
                  className="rounded-md border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-50 dark:hover:bg-violet-900"
                >
                  {actionBusy === "mark_fulfillment_delivered" ? "Updating…" : "Mark fulfillment delivered"}
                </button>
              </div>
              <p className="mt-2 text-xs text-violet-900/80 dark:text-violet-200/80">
                Buttons disable when the graph says the step does not apply (e.g. already captured). If a button stays disabled but Admin shows an action, refresh—payment rows load with this dialog&apos;s order fetch.
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Medusa order status</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Database enum only (not custom labels). Typical flow: <code className="rounded bg-white px-1 dark:bg-neutral-950">pending</code> →{" "}
              <code className="rounded bg-white px-1 dark:bg-neutral-950">completed</code> when the order is done.
            </p>
            <label className="mt-3 block text-sm">
              <span className="sr-only">Order status</span>
              <select
                value={medusaStatus}
                onChange={(e) => setMedusaStatus(e.target.value)}
                className="mt-1 w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
              >
                {MEDUSA_ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Ops handling (metadata)</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Stored as <code className="rounded bg-white px-1 dark:bg-neutral-950">metadata.horo_ops_handling</code>. Shown on the buyer
              confirmation page after refresh. This is <strong>not</strong> Medusa fulfillment state.
            </p>
            <label className="mt-3 block text-sm">
              <span className="sr-only">Handling status</span>
              <select
                value={opsHandling}
                onChange={(e) => setOpsHandling(e.target.value)}
                className="mt-1 w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
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
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {saving ? "Saving…" : "Save to Medusa"}
            </button>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-sm text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
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
