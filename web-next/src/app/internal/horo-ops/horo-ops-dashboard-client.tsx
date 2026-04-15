"use client";

import { useCallback, useEffect, useState } from "react";

import { HoroOpsOrderDetailDialog } from "./horo-ops-order-detail-dialog";

type SummarizedOrder = {
  id: string;
  display_id?: number | string | null;
  friendly?: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string | null;
  status?: string | null;
  currency_code?: string | null;
  total?: unknown;
  fulfillment_status?: string | null;
  payment_status?: string | null;
  sla_deadline?: string | null;
  sla_deadline_day_utc?: string | null;
  metadata?: Record<string, unknown> | null;
};

type DashboardAlarm = {
  order_id: string;
  display_id?: number | string | null;
  friendly: string | null;
  kind: string;
  message: string;
  severity: "warning" | "critical";
};

type TodayQueueItem = {
  order_id: string;
  display_id?: number | string | null;
  friendly: string | null;
  reasons: string[];
  priority: number;
};

type DashboardMeta = {
  fetch_mode?: "all" | "page";
  skip?: number;
  take?: number;
  raw_rows?: number;
  dropped_missing_created_at?: number;
  loaded?: number;
  list_max?: number;
  max_orders?: number;
  batch_size?: number;
  batches?: number;
  truncated?: boolean;
  include_graph?: boolean;
  order_graph_count?: number;
  note?: string;
  delivery_schedule_utc_day?: string;
  classify_config?: { slaDeliveryDays?: number };
};

type DashboardJson = {
  meta?: DashboardMeta;
  order_graphs?: Record<string, Record<string, unknown>>;
  delivery?: {
    due_today: SummarizedOrder[];
    due_tomorrow: SummarizedOrder[];
    due_in_2_to_3_days: SummarizedOrder[];
  };
  list?: SummarizedOrder[];
  dueSoon?: SummarizedOrder[];
  deliveredRecently?: SummarizedOrder[];
  moneyCollected?: { by_currency?: Record<string, number>; orders?: SummarizedOrder[] };
  alarms?: DashboardAlarm[];
  today?: TodayQueueItem[];
};

type LookupMatch = Record<string, unknown>;

type LookupResponse = {
  matches?: LookupMatch[];
  friendly?: string | null;
};

function JsonBlock({ data, className }: { data: unknown; className?: string }) {
  return (
    <pre
      className={`mt-2 max-h-64 overflow-auto rounded-md bg-neutral-100 p-3 text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 ${className ?? ""}`}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function parseOrderTotalDisplay(total: unknown): number {
  if (typeof total === "number" && Number.isFinite(total)) return Math.round(total);
  if (typeof total === "string") {
    const n = parseFloat(total);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  if (total && typeof total === "object" && "numeric_" in (total as object)) {
    const v = (total as { numeric_?: unknown }).numeric_;
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  }
  return 0;
}

function formatMoney(currency: string | null | undefined, total: unknown): string {
  const code = (currency || "—").toUpperCase();
  const n = parseOrderTotalDisplay(total);
  return `${n.toLocaleString()} ${code}`;
}

function formatDateShort(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatMetadataPreview(meta: unknown): string {
  if (meta == null) return "—";
  try {
    const s = JSON.stringify(meta);
    if (s === "{}") return "{}";
    return s.length > 96 ? `${s.slice(0, 96)}…` : s;
  } catch {
    return "…";
  }
}

function refLabel(row: { friendly?: string | null; display_id?: unknown; id: string }): string {
  if (row.friendly) return row.friendly;
  if (typeof row.display_id === "number" && row.display_id > 0) return `HORO-${Math.floor(row.display_id)}`;
  if (typeof row.display_id === "string") {
    const n = parseInt(row.display_id.trim(), 10);
    if (Number.isFinite(n) && n > 0) return `HORO-${n}`;
  }
  return row.id.slice(0, 14) + (row.id.length > 14 ? "…" : "");
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/90 px-4 py-10 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-800 dark:text-neutral-100">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
        {badge ? (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function OrderTable({
  rows,
  showSla,
  showMetadata = true,
  emptyHint,
  onRowClick,
}: {
  rows: SummarizedOrder[];
  showSla?: boolean;
  showMetadata?: boolean;
  emptyHint?: string;
  onRowClick?: (row: SummarizedOrder) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No rows in this bucket"
        hint={
          emptyHint ??
          "Nothing matched this filter. If you use “single page” mode, try a larger Take or different Skip."
        }
      />
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
            <th className="px-3 py-2">Ref</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Payment</th>
            <th className="px-3 py-2">Fulfillment</th>
            <th className="px-3 py-2 text-right">Total</th>
            {showSla ? <th className="px-3 py-2">SLA day (UTC)</th> : null}
            {showMetadata ? <th className="px-3 py-2">Metadata</th> : null}
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
            >
              <td className="px-3 py-2">
                {onRowClick ? (
                  <button
                    type="button"
                    onClick={() => onRowClick(row)}
                    className="font-medium text-sky-800 underline decoration-sky-300/70 underline-offset-2 hover:text-sky-950 dark:text-sky-300 dark:hover:text-sky-100"
                  >
                    {refLabel(row)}
                  </button>
                ) : (
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{refLabel(row)}</span>
                )}
              </td>
              <td className="max-w-40 truncate px-3 py-2 text-neutral-600 dark:text-neutral-300" title={row.email || ""}>
                {row.email || "—"}
              </td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{row.status || "—"}</td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{row.payment_status || "—"}</td>
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{row.fulfillment_status || "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatMoney(row.currency_code, row.total)}
              </td>
              {showSla ? (
                <td className="px-3 py-2 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {row.sla_deadline_day_utc || "—"}
                </td>
              ) : null}
              {showMetadata ? (
                <td
                  className="max-w-48 truncate px-3 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-400"
                  title={row.metadata ? JSON.stringify(row.metadata) : ""}
                >
                  {formatMetadataPreview(row.metadata)}
                </td>
              ) : null}
              <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                {formatDateShort(row.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlarmList({ alarms }: { alarms: DashboardAlarm[] }) {
  if (alarms.length === 0) {
    return (
      <EmptyState title="No alarms in loaded set" hint="Open orders that look risky (SLA, stale payment/fulfillment) appear here." />
    );
  }
  return (
    <ul className="space-y-2">
      {alarms.map((a) => {
        const critical = a.severity === "critical";
        return (
          <li
            key={`${a.order_id}-${a.kind}`}
            className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between ${
              critical
                ? "border-red-200 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/40"
                : "border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30"
            }`}
          >
            <div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {a.friendly || refLabel({ id: a.order_id, display_id: a.display_id, friendly: null })}
              </span>
              <span className="ml-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">{a.kind}</span>
              <p className="mt-0.5 text-neutral-700 dark:text-neutral-300">{a.message}</p>
            </div>
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                critical ? "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100" : "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100"
              }`}
            >
              {a.severity}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function TodayQueue({ items }: { items: TodayQueueItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="Queue is clear" hint="Nothing scored as high-priority for action on the loaded orders." />;
  }
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  return (
    <ol className="space-y-3">
      {sorted.map((item, i) => (
        <li
          key={item.order_id}
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/40 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {item.friendly || refLabel({ id: item.order_id, display_id: item.display_id, friendly: null })}
              </p>
              <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{item.order_id}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {item.reasons.map((r) => (
                  <li
                    key={r}
                    className="rounded-md bg-white px-2 py-0.5 text-xs text-neutral-700 ring-1 ring-neutral-200 dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="shrink-0 text-right text-xs text-neutral-500 dark:text-neutral-400">Priority {item.priority}</div>
        </li>
      ))}
    </ol>
  );
}

function MoneySummary({
  byCurrency,
  orders,
  onRowClick,
}: {
  byCurrency: Record<string, number>;
  orders: SummarizedOrder[];
  onRowClick?: (row: SummarizedOrder) => void;
}) {
  const entries = Object.entries(byCurrency).filter(([, v]) => v > 0);
  if (entries.length === 0 && orders.length === 0) {
    return (
      <EmptyState title="No captured payments in loaded set" hint="Totals aggregate paid/captured orders in the orders Medusa returned for this request." />
    );
  }
  return (
    <div className="space-y-4">
      {entries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {entries.map(([code, amount]) => (
            <div
              key={code}
              className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30"
            >
              <p className="text-xs font-medium uppercase text-emerald-800 dark:text-emerald-200">{code.toUpperCase()}</p>
              <p className="text-lg font-semibold tabular-nums text-emerald-950 dark:text-emerald-50">{amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : null}
      {orders.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Orders contributing to totals</p>
          <OrderTable rows={orders} showSla={false} onRowClick={onRowClick} />
        </div>
      ) : null}
    </div>
  );
}

function LookupPanel({ data }: { data: LookupResponse }) {
  const matches = data.matches ?? [];
  if (matches.length === 0) {
    return <EmptyState title="No matches" hint="Try a Medusa order id, display id, or HORO-12 style reference." />;
  }
  return (
    <div className="space-y-3">
      {data.friendly ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Matched reference: <span className="font-semibold text-neutral-900 dark:text-white">{data.friendly}</span>
        </p>
      ) : null}
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Each row is the full Medusa order graph for that match (items, addresses, shipping_methods, metadata, totals).
      </p>
      <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Fulfill</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Metadata</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={String(m.id)} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                <td className="px-3 py-2 font-medium">{refLabel({ id: String(m.id), display_id: m.display_id, friendly: null })}</td>
                <td className="max-w-48 truncate px-3 py-2 text-neutral-600 dark:text-neutral-300">
                  {typeof m.email === "string" ? m.email : "—"}
                </td>
                <td className="px-3 py-2">{typeof m.status === "string" ? m.status : "—"}</td>
                <td className="px-3 py-2">{typeof m.payment_status === "string" ? m.payment_status : "—"}</td>
                <td className="px-3 py-2">{typeof m.fulfillment_status === "string" ? m.fulfillment_status : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatMoney(typeof m.currency_code === "string" ? m.currency_code : null, m.total)}
                </td>
                <td
                  className="max-w-48 truncate px-3 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-400"
                  title={m.metadata ? JSON.stringify(m.metadata) : ""}
                >
                  {formatMetadataPreview(m.metadata)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-500">
                  {formatDateShort(typeof m.created_at === "string" ? m.created_at : null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-xs text-neutral-400">id: {String(matches[0]?.id)}</p>
    </div>
  );
}

export function HoroOpsDashboardClient() {
  const [fetchMode, setFetchMode] = useState<"all" | "page">("all");
  const [includeGraph, setIncludeGraph] = useState(true);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(50);
  const [dashboard, setDashboard] = useState<DashboardJson | null>(null);
  const [lookupQ, setLookupQ] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRawLookup, setShowRawLookup] = useState(false);
  const [showRawDashboard, setShowRawDashboard] = useState(false);
  const [showOrderGraphs, setShowOrderGraphs] = useState(false);
  const [orderDetail, setOrderDetail] = useState<{ id: string; summary: SummarizedOrder } | null>(null);

  const openOrderDetail = useCallback((row: SummarizedOrder) => {
    setOrderDetail({ id: row.id, summary: row });
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set("mode", fetchMode);
      q.set("include_graph", includeGraph ? "1" : "0");
      if (fetchMode === "page") {
        q.set("skip", String(skip));
        q.set("take", String(take));
      }
      const res = await fetch(`/api/horo-ops/dashboard?${q.toString()}`, {
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text || res.statusText);
        setDashboard(null);
        return;
      }
      setDashboard(JSON.parse(text) as DashboardJson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [skip, take, fetchMode, includeGraph]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const runLookup = async () => {
    setError(null);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/horo-ops/lookup?q=${encodeURIComponent(lookupQ.trim())}`, {
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text || res.statusText);
        return;
      }
      setLookupResult(JSON.parse(text) as LookupResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    }
  };

  const logout = async () => {
    await fetch("/api/horo-ops/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/internal/horo-ops/login";
  };

  const meta = dashboard?.meta;
  const delivery = dashboard?.delivery;
  const slaDays = meta?.classify_config?.slaDeliveryDays;
  const scheduleDay = meta?.delivery_schedule_utc_day;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">HORO order ops</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Internal dashboard. Not linked from the storefront.</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          Sign out
        </button>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="lookup-heading" className="space-y-3">
        <h2 id="lookup-heading" className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Search by reference or order number
        </h2>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="horo-ops-q">
            Query
          </label>
          <input
            id="horo-ops-q"
            value={lookupQ}
            onChange={(e) => setLookupQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runLookup();
            }}
            placeholder="HORO-12, display id, or order id"
            className="min-w-[16rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
          />
          <button
            type="button"
            onClick={() => void runLookup()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Search
          </button>
        </div>
        {lookupResult ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <LookupPanel data={lookupResult} />
            <button
              type="button"
              onClick={() => setShowRawLookup((v) => !v)}
              className="mt-3 text-xs font-medium text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {showRawLookup ? "Hide" : "Show"} raw JSON
            </button>
            {showRawLookup ? <JsonBlock data={lookupResult} /> : null}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="dash-heading" className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <h2 id="dash-heading" className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Orders
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-neutral-600 dark:text-neutral-400">Load</span>
                <select
                  value={fetchMode}
                  onChange={(e) => setFetchMode(e.target.value === "page" ? "page" : "all")}
                  className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  <option value="all">All orders (batched)</option>
                  <option value="page">Single page</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={includeGraph}
                  onChange={(e) => setIncludeGraph(e.target.checked)}
                  className="rounded border-neutral-400"
                />
                Full Medusa graph + metadata
              </label>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                disabled={loading}
                className="rounded-md border border-neutral-300 px-3 py-1 font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-900"
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>
          {fetchMode === "page" ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label>
                Skip{" "}
                <input
                  type="number"
                  min={0}
                  value={skip}
                  onChange={(e) => setSkip(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
                />
              </label>
              <label>
                Take{" "}
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={take}
                  onChange={(e) => setTake(Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 50)))}
                  className="w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
                />
              </label>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Medusa loads every order up to <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">HORO_OPS_DASHBOARD_MAX_ORDERS</code> in
              batches. Turn off “Full Medusa graph” for a lighter JSON payload (summary rows still include <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">metadata</code> when present).
            </p>
          )}
        </div>

        {meta && (meta.loaded !== undefined || meta.batches !== undefined) ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
              <span className="font-medium">Fetch:</span> mode={meta.fetch_mode ?? "—"} · loaded={meta.loaded ?? "—"}
              {meta.raw_rows != null ? ` · raw_rows=${meta.raw_rows}` : null}
              {meta.dropped_missing_created_at != null && meta.dropped_missing_created_at > 0
                ? ` · dropped_missing_created_at=${meta.dropped_missing_created_at}`
                : null}
              {meta.batches != null ? ` · batches=${meta.batches}` : null}
              {meta.order_graph_count != null ? ` · order_graphs=${meta.order_graph_count}` : null}
              {meta.truncated ? " · truncated at cap" : null}
              {meta.max_orders != null ? ` · max_orders=${meta.max_orders}` : null}
            </div>
            {meta.raw_rows === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                Medusa returned <strong>zero</strong> orders for this request. The store route uses your{" "}
                <strong>publishable API key</strong>: only orders tied to that key&apos;s sales channel (same as the storefront
                checkout) appear here. Orders created only in Medusa Admin or under another channel will not show. Align{" "}
                <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY</code> with
                the channel where orders were placed, or place a test order through the live storefront.
              </p>
            ) : null}
            {(meta.dropped_missing_created_at ?? 0) > 0 ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
                {meta.dropped_missing_created_at} row(s) had no usable <code className="rounded bg-red-100/80 px-1 dark:bg-red-900/80">created_at</code> after
                normalization. If this persists after refresh, check Medusa / DB for those orders.
              </p>
            ) : null}
          </div>
        ) : null}

        {meta?.note ? <p className="text-xs text-neutral-500 dark:text-neutral-400">{meta.note}</p> : null}

        {scheduleDay ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
            <p className="font-medium">SLA “today” in UTC is {scheduleDay}.</p>
            <p className="mt-1 text-xs text-sky-900/90 dark:text-sky-200/90">
              Delivery buckets compare each order&apos;s SLA deadline day (UTC) to that day. Deadline = order{" "}
              <code className="rounded bg-sky-100 px-1 dark:bg-sky-900">created_at</code> +{" "}
              {typeof slaDays === "number" ? (
                <strong>
                  {slaDays} calendar day{slaDays === 1 ? "" : "s"}
                </strong>
              ) : (
                "configured SLA calendar days"
              )}{" "}
              (UTC). Open / not-yet-delivered orders only.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title="Deliver today"
            subtitle="SLA deadline falls on UTC “today”"
            badge={delivery ? `${delivery.due_today.length}` : "0"}
          >
            <OrderTable rows={delivery?.due_today ?? []} onRowClick={openOrderDetail} />
          </SectionCard>
          <SectionCard
            title="Deliver tomorrow"
            subtitle="SLA deadline is the next UTC calendar day"
            badge={delivery ? `${delivery.due_tomorrow.length}` : "0"}
          >
            <OrderTable rows={delivery?.due_tomorrow ?? []} onRowClick={openOrderDetail} />
          </SectionCard>
          <SectionCard
            title="In 2–3 days"
            subtitle="SLA deadline UTC day is +2 or +3 from today"
            badge={delivery ? `${delivery.due_in_2_to_3_days.length}` : "0"}
          >
            <OrderTable rows={delivery?.due_in_2_to_3_days ?? []} onRowClick={openOrderDetail} />
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Due soon (SLA window)" subtitle="Deadline approaching within the configured horizon" badge={`${dashboard?.dueSoon?.length ?? 0}`}>
            <OrderTable rows={dashboard?.dueSoon ?? []} onRowClick={openOrderDetail} />
          </SectionCard>
          <SectionCard title="Delivered recently" subtitle="Recently fulfilled in the loaded set" badge={`${dashboard?.deliveredRecently?.length ?? 0}`}>
            <OrderTable rows={dashboard?.deliveredRecently ?? []} showSla={false} onRowClick={openOrderDetail} />
          </SectionCard>
        </div>

        <SectionCard
          title="Money collected"
          subtitle="Captured / paid totals across the loaded orders"
          badge={dashboard?.moneyCollected?.orders?.length ? `${dashboard.moneyCollected.orders.length} orders` : undefined}
        >
          <MoneySummary
            byCurrency={dashboard?.moneyCollected?.by_currency ?? {}}
            orders={dashboard?.moneyCollected?.orders ?? []}
            onRowClick={openOrderDetail}
          />
        </SectionCard>

        <SectionCard title="Alarms" subtitle="Risk flags for loaded orders" badge={`${dashboard?.alarms?.length ?? 0}`}>
          <AlarmList alarms={dashboard?.alarms ?? []} />
        </SectionCard>

        <SectionCard title="What to do today" subtitle="Prioritized queue from the loaded set" badge={`${dashboard?.today?.length ?? 0}`}>
          <TodayQueue items={dashboard?.today ?? []} />
        </SectionCard>

        <SectionCard
          title="Order list"
          subtitle="Summary per order from Medusa (newest first); metadata column when present"
          badge={meta?.loaded !== undefined ? `${meta.loaded} loaded` : undefined}
        >
          {dashboard?.list && dashboard.list.length > 0 ? (
            <OrderTable rows={dashboard.list} onRowClick={openOrderDetail} />
          ) : (
            <EmptyState
              title={loading ? "Loading…" : "No orders"}
              hint={
                fetchMode === "page"
                  ? "Adjust Skip/Take or refresh."
                  : "Nothing returned (check Medusa) or list was truncated; raise HORO_OPS_DASHBOARD_MAX_ORDERS if needed."
              }
            />
          )}
        </SectionCard>

        {dashboard?.order_graphs && Object.keys(dashboard.order_graphs).length > 0 ? (
          <SectionCard
            title="Complete order graphs"
            subtitle="Full Medusa graph JSON keyed by order id (same payload as Remote Query)"
            badge={`${Object.keys(dashboard.order_graphs).length}`}
          >
            <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              Can be very large. Open only when you need the raw nested structure (line items, addresses, shipping_methods, etc.).
            </p>
            <button
              type="button"
              onClick={() => setShowOrderGraphs((v) => !v)}
              className="text-xs font-medium text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              {showOrderGraphs ? "Hide" : "Show"} order_graphs JSON
            </button>
            {showOrderGraphs ? (
              <JsonBlock className="max-h-[min(70vh,36rem)]" data={dashboard.order_graphs} />
            ) : null}
          </SectionCard>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowRawDashboard((v) => !v)}
            className="text-xs font-medium text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {showRawDashboard ? "Hide" : "Show"} full dashboard JSON
          </button>
        </div>
        {showRawDashboard && dashboard ? <JsonBlock data={dashboard} /> : null}
      </section>

      <HoroOpsOrderDetailDialog
        open={orderDetail !== null}
        orderId={orderDetail?.id ?? null}
        summary={orderDetail?.summary ?? null}
        initialGraph={orderDetail?.id ? dashboard?.order_graphs?.[orderDetail.id] : undefined}
        onClose={() => setOrderDetail(null)}
        onSaved={() => {
          void loadDashboard();
        }}
      />
    </div>
  );
}
