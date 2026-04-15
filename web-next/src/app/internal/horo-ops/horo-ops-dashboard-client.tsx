"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  customerDisplayNameFromGraph,
  filterOrdersByFulfillmentChip,
  filterOrdersByPaymentChip,
  metadataBadgeValues,
  type FulfillFilter,
  type PayFilter,
  type SortDir,
  type SortKey,
  sortSummarizedOrders,
} from "./horo-ops-dashboard-table-helpers";
import { HoroOpsOrderDetailDialog } from "./horo-ops-order-detail-dialog";
import { useHoroOpsToastStrict } from "./horo-ops-toast";

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
  instapayAwaitingCapture?: SummarizedOrder[];
  instapayAwaitingShipment?: SummarizedOrder[];
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

const DENSITY_KEY = "horo_ops_table_density";

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

function refLabel(row: { friendly?: string | null; display_id?: unknown; id: string }): string {
  if (row.friendly) return row.friendly;
  if (typeof row.display_id === "number" && row.display_id > 0) return `HORO-${Math.floor(row.display_id)}`;
  if (typeof row.display_id === "string") {
    const n = parseInt(row.display_id.trim(), 10);
    if (Number.isFinite(n) && n > 0) return `HORO-${n}`;
  }
  /** Never show a raw ULID as the primary label; full id stays on `title` in the table cell. */
  return "Order";
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
  id: sectionId,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={sectionId} className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 dark:border-neutral-800">
        <div>
          <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
        {badge ? (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-4 pt-0">{children}</div>
    </section>
  );
}

function MetadataBadges({ meta }: { meta: Record<string, unknown> | null | undefined }) {
  const b = metadataBadgeValues(meta ?? undefined);
  const entries = Object.entries(b).filter(([, v]) => v != null && String(v).length > 0) as [string, string][];
  if (entries.length === 0) return <span className="text-neutral-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="max-w-[7rem] truncate rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          title={`${k}: ${v}`}
        >
          {k.replace(/_/g, " ")}: {v}
        </span>
      ))}
      <details className="inline">
        <summary className="cursor-pointer list-none text-[10px] font-medium text-sky-700 underline dark:text-sky-300">
          …
        </summary>
        <pre className="mt-1 max-h-32 max-w-xs overflow-auto rounded border border-neutral-200 bg-white p-2 text-[10px] dark:border-neutral-700 dark:bg-neutral-950">
          {JSON.stringify(meta ?? {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-neutral-200/80 dark:bg-neutral-800/80" />
      ))}
    </div>
  );
}

function OrderTable({
  rows,
  orderGraphs,
  includeGraph,
  showSla,
  showMetadataBadges = true,
  emptyTitle,
  emptyHint,
  onRowClick,
  density = "comfortable",
  sortable = false,
  sortKey = "ref",
  sortDir = "desc",
  onSortChange,
  filterPay,
  filterFulfill,
  onFilterPay,
  onFilterFulfill,
  showFilterChips = false,
  bulkSelect = false,
  selectedIds,
  onToggleRow,
  onToggleAllPage,
  tableCaption,
}: {
  rows: SummarizedOrder[];
  orderGraphs?: Record<string, Record<string, unknown>>;
  includeGraph?: boolean;
  showSla?: boolean;
  showMetadataBadges?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  onRowClick?: (row: SummarizedOrder) => void;
  density?: "comfortable" | "compact";
  sortable?: boolean;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSortChange?: (k: SortKey) => void;
  filterPay?: PayFilter;
  filterFulfill?: FulfillFilter;
  onFilterPay?: (p: PayFilter) => void;
  onFilterFulfill?: (f: FulfillFilter) => void;
  showFilterChips?: boolean;
  bulkSelect?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAllPage?: () => void;
  /** Accessibility: caption for screen readers (keyboard: ↑/↓ or j/k between rows when a row is focused). */
  tableCaption?: string;
}) {
  const rowPad = density === "compact" ? "py-1" : "py-2.5";
  const [focusRow, setFocusRow] = useState(0);
  const rowKey = rows.map((r) => r.id).join("|");
  useEffect(() => {
    setFocusRow(0);
  }, [rowKey]);
  const th = (label: string, key?: SortKey) => {
    if (!sortable || !key || !onSortChange) {
      return (
        <th className={`px-3 ${rowPad} text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400`}>
          {label}
        </th>
      );
    }
    const active = sortKey === key;
    const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : "";
    return (
      <th className={`px-3 ${rowPad} text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400`}>
        <button
          type="button"
          className={`rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${active ? "text-sky-700 dark:text-sky-300" : ""}`}
          onClick={() => onSortChange(key)}
        >
          {label}
          {arrow}
        </button>
      </th>
    );
  };

  const chipPay = (cur: PayFilter, val: PayFilter, label: string) => (
    <button
      type="button"
      onClick={() => onFilterPay?.(val)}
      className={`rounded-full px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
        cur === val ? "bg-sky-600 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
      }`}
    >
      {label}
    </button>
  );
  const chipFulfill = (cur: FulfillFilter, val: FulfillFilter, label: string) => (
    <button
      type="button"
      onClick={() => onFilterFulfill?.(val)}
      className={`rounded-full px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
        cur === val ? "bg-sky-600 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
      }`}
    >
      {label}
    </button>
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "No rows in this bucket"}
        hint={
          emptyHint ??
          "Nothing matched this filter. If you use “single page” mode, try a larger Take or different Skip."
        }
      />
    );
  }

  const allSelected = bulkSelect && rows.length > 0 && rows.every((r) => selectedIds?.has(r.id));

  return (
    <div className="space-y-3">
      {showFilterChips && onFilterPay && onFilterFulfill && filterPay != null && filterFulfill != null ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500">Payment</span>
          <div className="flex flex-wrap gap-1">
            {chipPay(filterPay, "all", "All")}
            {chipPay(filterPay, "captured", "Captured")}
            {chipPay(filterPay, "pending", "Pending")}
            {chipPay(filterPay, "failed", "Failed")}
          </div>
          <span className="ml-2 text-neutral-500">Fulfillment</span>
          <div className="flex flex-wrap gap-1">
            {chipFulfill(filterFulfill, "all", "All")}
            {chipFulfill(filterFulfill, "not_fulfilled", "Not fulfilled")}
            {chipFulfill(filterFulfill, "partial", "Partial")}
            {chipFulfill(filterFulfill, "fulfilled", "Fulfilled")}
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          {tableCaption ? <caption className="sr-only">{tableCaption}</caption> : null}
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/80">
              {bulkSelect ? (
                <th className={`w-10 px-2 ${rowPad}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleAllPage?.()}
                    className="rounded border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-label="Select all rows on this page"
                  />
                </th>
              ) : null}
              {th("Ref", "ref")}
              <th className={`px-3 ${rowPad} text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400`}>
                Customer
              </th>
              {th("Medusa status")}
              {th("Payment")}
              {th("Fulfillment")}
              {th("Total", "total")}
              {showSla ? th("SLA day (UTC)", "sla") : null}
              {showMetadataBadges ? (
                <th className={`px-3 ${rowPad} text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400`}>
                  Flags
                </th>
              ) : null}
              {th("Created", "created")}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const g = orderGraphs?.[row.id];
              const name = includeGraph && g ? customerDisplayNameFromGraph(g) : "";
              const focusNext = (delta: number) => {
                if (!onRowClick || rows.length === 0) return;
                const ni = Math.max(0, Math.min(rows.length - 1, i + delta));
                setFocusRow(ni);
                requestAnimationFrame(() => {
                  document.getElementById(`horo-ops-row-${rows[ni]?.id}`)?.focus();
                });
              };
              return (
                <tr
                  key={row.id}
                  id={onRowClick ? `horo-ops-row-${row.id}` : undefined}
                  className={`cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80 dark:border-neutral-900 dark:hover:bg-neutral-900/50 ${rowPad}`}
                  onClick={() => {
                    setFocusRow(i);
                    onRowClick?.(row);
                  }}
                  onFocus={() => {
                    if (onRowClick) setFocusRow(i);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick?.(row);
                      return;
                    }
                    if (!onRowClick) return;
                    if (e.key === "ArrowDown" || e.key === "j") {
                      e.preventDefault();
                      focusNext(1);
                      return;
                    }
                    if (e.key === "ArrowUp" || e.key === "k") {
                      e.preventDefault();
                      focusNext(-1);
                    }
                  }}
                  tabIndex={onRowClick ? (i === focusRow ? 0 : -1) : undefined}
                >
                  {bulkSelect ? (
                    <td className="px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(row.id) ?? false}
                        onChange={() => onToggleRow?.(row.id)}
                        className="rounded border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        aria-label={`Select ${refLabel(row)}`}
                      />
                    </td>
                  ) : null}
                  <td className={`px-3 font-medium text-sky-800 dark:text-sky-300 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                    <span className="underline decoration-sky-300/70 underline-offset-2" title={row.id}>
                      {refLabel(row)}
                    </span>
                  </td>
                  <td className={`max-w-48 px-3 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                    {name ? (
                      <>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{name}</span>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{row.email || "—"}</p>
                      </>
                    ) : (
                      <span className="text-neutral-600 dark:text-neutral-300">{row.email || (includeGraph ? "—" : "—")}</span>
                    )}
                    {!includeGraph ? (
                      <p className="text-[10px] text-neutral-400">Turn on full graph for customer name</p>
                    ) : null}
                  </td>
                  <td className={`px-3 text-neutral-600 dark:text-neutral-300 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                    {row.status || "—"}
                  </td>
                  <td className={`px-3 text-neutral-600 dark:text-neutral-300 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                    {row.payment_status || "—"}
                  </td>
                  <td className={`px-3 text-neutral-600 dark:text-neutral-300 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                    {row.fulfillment_status || "—"}
                  </td>
                  <td
                    className={`px-3 text-right tabular-nums text-neutral-900 dark:text-neutral-100 ${
                      density === "compact" ? "py-1" : "py-2.5"
                    }`}
                  >
                    {formatMoney(row.currency_code, row.total)}
                  </td>
                  {showSla ? (
                    <td
                      className={`px-3 font-mono text-xs text-neutral-700 dark:text-neutral-300 ${
                        density === "compact" ? "py-1" : "py-2.5"
                      }`}
                    >
                      {row.sla_deadline_day_utc || "—"}
                    </td>
                  ) : null}
                  {showMetadataBadges ? (
                    <td className={`max-w-52 px-3 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                      <MetadataBadges meta={row.metadata ?? undefined} />
                    </td>
                  ) : null}
                  <td className={`whitespace-nowrap px-3 text-xs text-neutral-500 dark:text-neutral-400 ${density === "compact" ? "py-1" : "py-2.5"}`}>
                    {formatDateShort(row.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlarmList({ alarms, severityFilter }: { alarms: DashboardAlarm[]; severityFilter: "all" | "critical" }) {
  const list = severityFilter === "critical" ? alarms.filter((a) => a.severity === "critical") : alarms;
  if (alarms.length === 0) {
    return (
      <EmptyState
        title="No alarms in loaded set"
        hint="Open orders that look risky (SLA, stale payment/fulfillment) appear here."
      />
    );
  }
  if (list.length === 0) {
    return <EmptyState title="No critical alarms" hint="Switch filter to “All” to see warnings." />;
  }
  return (
    <ul className="space-y-2">
      {list.map((a) => {
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

function TodayQueue({ items, onOpenOrder }: { items: TodayQueueItem[]; onOpenOrder: (id: string) => void }) {
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
              <button
                type="button"
                className="text-left font-semibold text-sky-800 underline decoration-sky-300/70 underline-offset-2 hover:text-sky-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-300"
                onClick={() => onOpenOrder(item.order_id)}
              >
                {item.friendly || refLabel({ id: item.order_id, display_id: item.display_id, friendly: null })}
              </button>
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
  orderGraphs,
  includeGraph,
  density,
  onRowClick,
}: {
  byCurrency: Record<string, number>;
  orders: SummarizedOrder[];
  orderGraphs?: Record<string, Record<string, unknown>>;
  includeGraph?: boolean;
  density: "comfortable" | "compact";
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
          <OrderTable
            rows={orders}
            orderGraphs={orderGraphs}
            includeGraph={includeGraph}
            showSla={false}
            density={density}
            onRowClick={onRowClick}
          />
        </div>
      ) : null}
    </div>
  );
}

function lookupMatchToSummary(m: LookupMatch): SummarizedOrder {
  return {
    id: String(m.id ?? ""),
    display_id: m.display_id as SummarizedOrder["display_id"],
    friendly: typeof m.friendly === "string" ? m.friendly : null,
    email: typeof m.email === "string" ? m.email : null,
    created_at: typeof m.created_at === "string" ? m.created_at : undefined,
    status: typeof m.status === "string" ? m.status : null,
    currency_code: typeof m.currency_code === "string" ? m.currency_code : null,
    total: m.total,
    fulfillment_status: typeof m.fulfillment_status === "string" ? m.fulfillment_status : null,
    payment_status: typeof m.payment_status === "string" ? m.payment_status : null,
    metadata: m.metadata && typeof m.metadata === "object" && !Array.isArray(m.metadata) ? (m.metadata as Record<string, unknown>) : null,
  };
}

function LookupPanel({
  data,
  onOpenMatch,
}: {
  data: LookupResponse;
  onOpenMatch: (row: SummarizedOrder) => void;
}) {
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
      <p className="text-xs text-neutral-500 dark:text-neutral-400">Click a row to open the same order detail as the tables.</p>
      <div className="overflow-x-auto rounded-lg border border-neutral-100 dark:border-neutral-800">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Open</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => {
              const row = lookupMatchToSummary(m);
              return (
                <tr
                  key={String(m.id)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
                  onClick={() => onOpenMatch(row)}
                >
                  <td className="px-3 py-2 font-medium text-sky-800 dark:text-sky-300">
                    <span title={row.id}>{refLabel(row)}</span>
                  </td>
                  <td className="max-w-48 truncate px-3 py-2 text-neutral-600 dark:text-neutral-300">{row.email || "—"}</td>
                  <td className="px-3 py-2">{row.payment_status || "—"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-sky-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMatch(row);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function normalizePayFilter(raw: string | null): PayFilter {
  if (raw === "captured" || raw === "pending" || raw === "failed") return raw;
  return "all";
}

function normalizeFulfillFilter(raw: string | null): FulfillFilter {
  if (raw === "not_fulfilled" || raw === "partial" || raw === "fulfilled") return raw;
  return "all";
}

function normalizeSortKey(raw: string | null): SortKey {
  if (raw === "total" || raw === "created" || raw === "sla") return raw;
  return "ref";
}

function normalizeSortDir(raw: string | null): SortDir {
  return raw === "asc" ? "asc" : "desc";
}

function clientSearchOrders(
  q: string,
  list: SummarizedOrder[] | undefined,
  graphs: Record<string, Record<string, unknown>> | undefined,
): SummarizedOrder[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2 || !list?.length) return [];
  return list.filter((row) => {
    const email = (row.email || "").toLowerCase();
    if (email.includes(needle)) return true;
    const name = graphs?.[row.id] ? customerDisplayNameFromGraph(graphs[row.id]).toLowerCase() : "";
    if (name.includes(needle)) return true;
    if (refLabel(row).toLowerCase().includes(needle)) return true;
    return false;
  });
}

export function HoroOpsDashboardClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useHoroOpsToastStrict();

  const listPay = normalizePayFilter(searchParams.get("ops_pay"));
  const listFulfill = normalizeFulfillFilter(searchParams.get("ops_fulfill"));
  const listSortKey = normalizeSortKey(searchParams.get("ops_sort"));
  const listSortDir = normalizeSortDir(searchParams.get("ops_sort_dir"));
  const alarmFilter = (searchParams.get("ops_alarm") === "critical" ? "critical" : "all") as "all" | "critical";
  const opsSkipParam = searchParams.get("ops_skip");
  const opsTakeParam = searchParams.get("ops_take");

  const pushQs = useCallback(
    (mutate: (q: URLSearchParams) => void) => {
      const q = new URLSearchParams(searchParams.toString());
      mutate(q);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setListPay = (p: PayFilter) =>
    pushQs((q) => {
      if (p === "all") q.delete("ops_pay");
      else q.set("ops_pay", p);
    });
  const setListFulfill = (f: FulfillFilter) =>
    pushQs((q) => {
      if (f === "all") q.delete("ops_fulfill");
      else q.set("ops_fulfill", f);
    });
  const setAlarmFilter = (a: "all" | "critical") =>
    pushQs((q) => {
      if (a === "all") q.delete("ops_alarm");
      else q.set("ops_alarm", "critical");
    });

  const [fetchMode, setFetchMode] = useState<"all" | "page">("all");

  const syncPagingToUrl = useCallback(
    (nextSkip: number, nextTake: number) => {
      if (fetchMode !== "page") return;
      pushQs((q) => {
        q.set("ops_skip", String(nextSkip));
        q.set("ops_take", String(nextTake));
      });
    },
    [fetchMode, pushQs],
  );
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
  const [showDebugMeta, setShowDebugMeta] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [instapaySelected, setInstapaySelected] = useState<Set<string>>(() => new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ order_id: string; ok: boolean; error?: string }[] | null>(null);
  const [orderDetail, setOrderDetail] = useState<{ id: string; summary: SummarizedOrder } | null>(null);

  const lookupInputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef<{ buf: string; t: number }>({ buf: "", t: 0 });
  const dashboardSuccessCount = useRef(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(DENSITY_KEY);
      if (v === "compact" || v === "comfortable") setDensity(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density]);

  useEffect(() => {
    if (fetchMode !== "page") return;
    if (opsSkipParam != null && opsSkipParam !== "") {
      const s = parseInt(opsSkipParam, 10);
      if (Number.isFinite(s) && s >= 0) setSkip(s);
    }
    if (opsTakeParam != null && opsTakeParam !== "") {
      const t = parseInt(opsTakeParam, 10);
      if (Number.isFinite(t) && t >= 1 && t <= 500) setTake(t);
    }
  }, [fetchMode, opsSkipParam, opsTakeParam]);

  const openOrderDetail = useCallback((row: SummarizedOrder) => {
    setOrderDetail({ id: row.id, summary: row });
  }, []);

  const openOrderById = useCallback(
    (id: string) => {
      const d = dashboard;
      const buckets = d
        ? [
            ...(d.list ?? []),
            ...(d.instapayAwaitingCapture ?? []),
            ...(d.instapayAwaitingShipment ?? []),
            ...(d.delivery?.due_today ?? []),
            ...(d.delivery?.due_tomorrow ?? []),
            ...(d.delivery?.due_in_2_to_3_days ?? []),
            ...(d.dueSoon ?? []),
            ...(d.deliveredRecently ?? []),
            ...(d.moneyCollected?.orders ?? []),
          ]
        : [];
      const row = buckets.find((r) => r.id === id) ?? ({ id, email: null } as SummarizedOrder);
      setOrderDetail({ id, summary: row });
    },
    [dashboard],
  );

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
        showToast("Dashboard refresh failed.", "error");
        return;
      }
      setDashboard(JSON.parse(text) as DashboardJson);
      dashboardSuccessCount.current += 1;
      if (dashboardSuccessCount.current > 1) {
        showToast("Dashboard updated.", "success", 2200);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load dashboard";
      setError(msg);
      setDashboard(null);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [fetchMode, includeGraph, skip, take, showToast]);

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
        showToast("Lookup failed.", "error");
        return;
      }
      setLookupResult(JSON.parse(text) as LookupResponse);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lookup failed";
      setError(msg);
      showToast(msg, "error");
    }
  };

  const logout = async () => {
    await fetch("/api/horo-ops/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/internal/horo-ops/login";
  };

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const instapayCaptureRows = dashboard?.instapayAwaitingCapture ?? [];
  const criticalCount = (dashboard?.alarms ?? []).filter((a) => a.severity === "critical").length;
  const dueTodayCount = dashboard?.delivery?.due_today.length ?? 0;
  const captureCount = instapayCaptureRows.length;
  const todayQueueCount = dashboard?.today?.length ?? 0;

  const processedList = useMemo(() => {
    const raw = dashboard?.list ?? [];
    let r = filterOrdersByPaymentChip(raw, listPay);
    r = filterOrdersByFulfillmentChip(r, listFulfill);
    return sortSummarizedOrders(r, listSortKey, listSortDir);
  }, [dashboard?.list, listFulfill, listPay, listSortDir, listSortKey]);

  const clientMatches = useMemo(
    () => clientSearchOrders(lookupQ, dashboard?.list, dashboard?.order_graphs),
    [dashboard?.list, dashboard?.order_graphs, lookupQ],
  );

  const toggleInstapaySelect = (id: string) => {
    setInstapaySelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAllInstapay = () => {
    const ids = instapayCaptureRows.map((r) => r.id);
    const allOn = ids.length > 0 && ids.every((id) => instapaySelected.has(id));
    if (allOn) setInstapaySelected(new Set());
    else setInstapaySelected(new Set(ids));
  };

  const runBulkCapture = async () => {
    const ids = Array.from(instapaySelected);
    if (ids.length === 0) return;
    setBulkRunning(true);
    setBulkResults(null);
    try {
      const res = await fetch("/api/horo-ops/order/action/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_ids: ids, action: "capture_payment" }),
      });
      const text = await res.text();
      if (!res.ok) {
        showToast(text || "Bulk capture failed", "error");
        setBulkRunning(false);
        return;
      }
      const parsed = JSON.parse(text) as { results?: { order_id: string; ok: boolean; error?: string }[] };
      const results = parsed.results ?? [];
      setBulkResults(results);
      const ok = results.filter((r) => r.ok).length;
      const bad = results.length - ok;
      showToast(`Bulk capture: ${ok} ok, ${bad} failed.`, bad > 0 ? "error" : "success", 5000);
      setInstapaySelected(new Set());
      await loadDashboard();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Bulk failed", "error");
    } finally {
      setBulkRunning(false);
    }
  };

  const meta = dashboard?.meta;
  const delivery = dashboard?.delivery;
  const slaDays = meta?.classify_config?.slaDeliveryDays;
  const scheduleDay = meta?.delivery_schedule_utc_day;
  const graphs = dashboard?.order_graphs;

  const currentPage = take > 0 ? Math.floor(skip / take) + 1 : 1;
  const listLen = dashboard?.list?.length ?? 0;
  const canPageNext = fetchMode === "page" && listLen >= take;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || tag === "select";
      if (e.key === "?" && !inField) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === "r" && !inField) {
        e.preventDefault();
        void loadDashboard();
      }
      if (e.key === "/" && document.activeElement !== lookupInputRef.current) {
        e.preventDefault();
        lookupInputRef.current?.focus();
      }
      if (!inField && e.key.toLowerCase() === "g") {
        seqRef.current = { buf: "g", t: Date.now() };
        return;
      }
      if (seqRef.current.buf === "g" && Date.now() - seqRef.current.t < 900) {
        if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          scrollToId("section-today-queue");
        }
        if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          scrollToId("section-instapay-capture");
        }
        seqRef.current = { buf: "", t: 0 };
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadDashboard]);

  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950";

  return (
    <div className={`relative mx-auto max-w-6xl space-y-10 px-4 py-10 ${instapaySelected.size > 0 ? "pb-28" : ""}`}>
      {loading && dashboard ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 bg-gradient-to-r from-sky-400 via-sky-600 to-sky-400 animate-pulse"
          aria-hidden
        />
      ) : null}
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">HORO order ops</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Internal dashboard. Not linked from the storefront.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className={`rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900 ${focusRing}`}
          >
            How this dashboard works
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className={`rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-900 ${focusRing}`}
          >
            Sign out
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Action summary">
        <div className="rounded-xl border border-red-300 bg-red-50/90 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-950 dark:text-red-50">Critical alarms</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-950 dark:text-red-50">{criticalCount}</p>
          <button
            type="button"
            onClick={() => {
              setAlarmFilter("critical");
              scrollToId("section-alarms");
            }}
            className={`mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 ${focusRing}`}
          >
            Review critical
          </button>
        </div>
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-50">InstaPay capture</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-950 dark:text-amber-50">{captureCount}</p>
          <button
            type="button"
            onClick={() => scrollToId("section-instapay-capture")}
            className={`mt-3 w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 ${focusRing}`}
          >
            Capture {captureCount} transfer{captureCount === 1 ? "" : "s"}
          </button>
        </div>
        <div className="rounded-xl border border-sky-300 bg-sky-50/90 p-4 dark:border-sky-800 dark:bg-sky-950/40">
          <p className="text-sm font-medium text-sky-950 dark:text-sky-50">Ship today (SLA)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-950 dark:text-sky-50">{dueTodayCount}</p>
          <p className="mt-1 text-xs text-sky-900/90 dark:text-sky-200/80">Queue today: {todayQueueCount} prioritized</p>
          <button
            type="button"
            onClick={() => scrollToId("section-deliver-today")}
            className={`mt-2 w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 ${focusRing}`}
          >
            Go to deliver today
          </button>
        </div>
      </section>

      <section aria-labelledby="lookup-heading" className="space-y-3">
        <h2 id="lookup-heading" className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Search by reference or order number
        </h2>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="horo-ops-q">
            Query
          </label>
          <input
            ref={lookupInputRef}
            id="horo-ops-q"
            value={lookupQ}
            onChange={(e) => setLookupQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runLookup();
            }}
            placeholder="HORO-12, display id, or order id"
            className={`min-w-[16rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 ${focusRing}`}
          />
          <button
            type="button"
            onClick={() => void runLookup()}
            className={`rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 ${focusRing}`}
          >
            Search
          </button>
        </div>
        {clientMatches.length > 0 && lookupQ.trim().length >= 2 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-xs font-medium text-neutral-500">In loaded orders ({clientMatches.length})</p>
            <ul className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
              {clientMatches.slice(0, 12).map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    onClick={() => openOrderDetail(row)}
                  >
                    <span className="font-medium text-sky-800 dark:text-sky-300" title={row.id}>
                      {refLabel(row)}
                    </span>
                    <span className="truncate text-xs text-neutral-500">{row.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {lookupResult ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <LookupPanel data={lookupResult} onOpenMatch={openOrderDetail} />
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
                  onChange={(e) => {
                    const v = e.target.value === "page" ? "page" : "all";
                    setFetchMode(v);
                    if (v === "all") {
                      pushQs((q) => {
                        q.delete("ops_skip");
                        q.delete("ops_take");
                      });
                    } else {
                      syncPagingToUrl(skip, take);
                    }
                  }}
                  className={`rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 ${focusRing}`}
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
              <label className="flex cursor-pointer items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span>Density</span>
                <select
                  value={density}
                  onChange={(e) => setDensity(e.target.value === "compact" ? "compact" : "comfortable")}
                  className={`rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100 ${focusRing}`}
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                disabled={loading}
                className={`rounded-md border border-neutral-300 px-3 py-1 font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-900 ${focusRing}`}
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>
          {fetchMode === "page" ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={skip <= 0 || loading}
                  onClick={() => {
                    setSkip(0);
                    syncPagingToUrl(0, take);
                  }}
                  className={`rounded-md border border-neutral-300 px-3 py-1 font-medium hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-600 ${focusRing}`}
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={skip <= 0 || loading}
                  onClick={() => {
                    const ns = Math.max(0, skip - take);
                    setSkip(ns);
                    syncPagingToUrl(ns, take);
                  }}
                  className={`rounded-md border border-neutral-300 px-3 py-1 font-medium hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-600 ${focusRing}`}
                >
                  Prev
                </button>
                <span className="text-neutral-600 dark:text-neutral-400">
                  Page {currentPage}
                  {meta?.loaded != null ? ` · rows this response ${meta.loaded}` : ""}
                </span>
                <button
                  type="button"
                  disabled={loading || !canPageNext}
                  onClick={() => {
                    const ns = skip + take;
                    setSkip(ns);
                    syncPagingToUrl(ns, take);
                  }}
                  className={`rounded-md border border-neutral-300 px-3 py-1 font-medium hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-600 ${focusRing}`}
                >
                  Next
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label>
                  Skip{" "}
                  <input
                    type="number"
                    min={0}
                    value={skip}
                    onChange={(e) => {
                      const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setSkip(v);
                      syncPagingToUrl(v, take);
                    }}
                    className={`w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950 ${focusRing}`}
                  />
                </label>
                <label>
                  Take{" "}
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={take}
                    onChange={(e) => {
                      const v = Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 50));
                      setTake(v);
                      syncPagingToUrl(skip, v);
                    }}
                    className={`w-20 rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950 ${focusRing}`}
                  />
                </label>
                <span className="text-xs text-neutral-500">
                  Showing {listLen === 0 ? 0 : skip + 1}–{skip + listLen} on this page
                </span>
              </div>
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
            {(meta.dropped_missing_created_at ?? 0) > 0 ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
                {meta.dropped_missing_created_at} row(s) had no usable <code className="rounded bg-red-100/80 px-1 dark:bg-red-900/80">created_at</code> after
                normalization. If this persists after refresh, check Medusa / DB for those orders.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setShowDebugMeta((v) => !v)}
              className={`text-xs font-medium text-neutral-600 underline dark:text-neutral-400 ${focusRing}`}
            >
              {showDebugMeta ? "Hide" : "Show"} debug fetch info
            </button>
            {showDebugMeta ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
                <span className="font-medium">Fetch:</span> mode={meta.fetch_mode ?? "—"} · loaded={meta.loaded ?? "—"}
                {meta.raw_rows != null ? ` · raw_rows=${meta.raw_rows}` : null}
                {meta.batches != null ? ` · batches=${meta.batches}` : null}
                {meta.order_graph_count != null ? ` · order_graphs=${meta.order_graph_count}` : null}
                {meta.truncated ? " · truncated at cap" : null}
                {meta.max_orders != null ? ` · max_orders=${meta.max_orders}` : null}
              </div>
            ) : null}
            {meta.raw_rows === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                Medusa returned <strong>zero</strong> orders for this request. The store route uses your{" "}
                <strong>publishable API key</strong>: only orders tied to that key&apos;s sales channel (same as the storefront checkout) appear here.
              </p>
            ) : null}
          </div>
        ) : loading && !dashboard ? (
          <TableSkeleton rows={6} />
        ) : null}

        {meta?.note ? <p className="text-xs text-neutral-500 dark:text-neutral-400">{meta.note}</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard id="section-alarms" title="Alarms" subtitle="Risk flags for loaded orders" badge={`${dashboard?.alarms?.length ?? 0}`}>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAlarmFilter("all")}
                className={`rounded-full px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 ${alarmFilter === "all" ? "bg-neutral-900 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAlarmFilter("critical")}
                className={`rounded-full px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 ${alarmFilter === "critical" ? "bg-red-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}
              >
                Critical only
              </button>
            </div>
            {loading && !dashboard ? <TableSkeleton rows={3} /> : <AlarmList alarms={dashboard?.alarms ?? []} severityFilter={alarmFilter} />}
          </SectionCard>
          <SectionCard id="section-today-queue" title="What to do today" subtitle="Prioritized queue from the loaded set" badge={`${dashboard?.today?.length ?? 0}`}>
            {loading && !dashboard ? (
              <TableSkeleton rows={3} />
            ) : (
              <TodayQueue items={dashboard?.today ?? []} onOpenOrder={openOrderById} />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            id="section-instapay-capture"
            title="Instapay — awaiting capture"
            subtitle="Confirm bank/wallet transfer, then Capture payment on the order"
            badge={`${instapayCaptureRows.length}`}
          >
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={instapayCaptureRows}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                emptyTitle="No InstaPay to capture — all transfers confirmed for this load."
                emptyHint="No Instapay orders in this load are waiting on capture (or none use Instapay)."
                onRowClick={openOrderDetail}
                density={density}
                bulkSelect
                selectedIds={instapaySelected}
                onToggleRow={toggleInstapaySelect}
                onToggleAllPage={toggleAllInstapay}
                tableCaption="InstaPay awaiting capture. When a row is focused, use Arrow Up or Down, or j and k, to move between rows; Enter opens the order."
              />
            )}
          </SectionCard>
          <SectionCard
            title="Instapay — ready to ship"
            subtitle="Payment captured; fulfillment not in a delivered end-state yet"
            badge={`${dashboard?.instapayAwaitingShipment?.length ?? 0}`}
          >
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={dashboard?.instapayAwaitingShipment ?? []}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                onRowClick={openOrderDetail}
                density={density}
                emptyTitle="No InstaPay orders ready to ship in this load."
                emptyHint="No Instapay orders in this load are past capture and still in the shipping path."
              />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            id="section-deliver-today"
            title="Deliver today"
            subtitle="SLA deadline falls on UTC “today”"
            badge={delivery ? `${delivery.due_today.length}` : "0"}
          >
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={delivery?.due_today ?? []}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                onRowClick={openOrderDetail}
                density={density}
                emptyTitle="Nothing to ship today for this SLA window."
                emptyHint="No open orders in this load have an SLA deadline on today's UTC schedule day."
              />
            )}
          </SectionCard>
          <SectionCard
            title="Deliver tomorrow"
            subtitle="SLA deadline is the next UTC calendar day"
            badge={delivery ? `${delivery.due_tomorrow.length}` : "0"}
          >
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={delivery?.due_tomorrow ?? []}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                onRowClick={openOrderDetail}
                density={density}
                emptyTitle="Nothing due tomorrow in this load."
                emptyHint="No open orders fall on the next UTC SLA day for this window."
              />
            )}
          </SectionCard>
          <SectionCard
            title="In 2–3 days"
            subtitle="SLA deadline UTC day is +2 or +3 from today"
            badge={delivery ? `${delivery.due_in_2_to_3_days.length}` : "0"}
          >
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={delivery?.due_in_2_to_3_days ?? []}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                onRowClick={openOrderDetail}
                density={density}
                emptyTitle="Nothing in the 2–3 day SLA window."
                emptyHint="No open orders in this load sit two or three UTC SLA days out."
              />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Due soon (SLA window)" subtitle="Deadline approaching within the configured horizon" badge={`${dashboard?.dueSoon?.length ?? 0}`}>
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={dashboard?.dueSoon ?? []}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                onRowClick={openOrderDetail}
                density={density}
                emptyTitle="Nothing in the due-soon SLA window."
                emptyHint="No orders in this load sit inside the configured approaching-deadline horizon."
              />
            )}
          </SectionCard>
          <SectionCard title="Delivered recently" subtitle="Recently fulfilled in the loaded set" badge={`${dashboard?.deliveredRecently?.length ?? 0}`}>
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : (
              <OrderTable
                rows={dashboard?.deliveredRecently ?? []}
                orderGraphs={graphs}
                includeGraph={includeGraph}
                showSla={false}
                onRowClick={openOrderDetail}
                density={density}
                emptyTitle="No recent deliveries in this load."
                emptyHint="Nothing matched the delivered-recently bucket for the orders Medusa returned."
              />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Money collected"
          subtitle="Captured / paid totals across the loaded orders"
          badge={dashboard?.moneyCollected?.orders?.length ? `${dashboard.moneyCollected.orders.length} orders` : undefined}
        >
          {loading && !dashboard ? (
            <TableSkeleton />
          ) : (
            <MoneySummary
              byCurrency={dashboard?.moneyCollected?.by_currency ?? {}}
              orders={dashboard?.moneyCollected?.orders ?? []}
              orderGraphs={graphs}
              includeGraph={includeGraph}
              density={density}
              onRowClick={openOrderDetail}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Order list"
          subtitle="Summary per order from Medusa (newest first); URL preserves sort and filters"
          badge={meta?.loaded !== undefined ? `${meta.loaded} loaded` : undefined}
        >
          {loading && !dashboard ? (
            <TableSkeleton rows={8} />
          ) : dashboard?.list && dashboard.list.length > 0 ? (
            <OrderTable
              rows={processedList}
              orderGraphs={graphs}
              includeGraph={includeGraph}
              onRowClick={openOrderDetail}
              density={density}
              sortable
              sortKey={listSortKey}
              sortDir={listSortDir}
              onSortChange={(k) => {
                pushQs((q) => {
                  const cur = normalizeSortKey(q.get("ops_sort"));
                  const curDir = normalizeSortDir(q.get("ops_sort_dir"));
                  if (k === cur) {
                    q.set("ops_sort_dir", curDir === "asc" ? "desc" : "asc");
                  } else {
                    if (k === "ref") q.delete("ops_sort");
                    else q.set("ops_sort", k);
                    q.delete("ops_sort_dir");
                  }
                });
              }}
              filterPay={listPay}
              filterFulfill={listFulfill}
              onFilterPay={setListPay}
              onFilterFulfill={setListFulfill}
              showFilterChips
              tableCaption="Order list: click column headers to sort; use filters for payment and fulfillment. When a row is focused, Arrow Up or Down or j and k moves between rows; Enter opens the order."
            />
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

      {instapaySelected.size > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{instapaySelected.size} selected</p>
              {bulkRunning ? (
                <div
                  className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/40"
                  role="progressbar"
                  aria-valuetext="Bulk capture in progress"
                >
                  <div className="h-full w-2/5 animate-pulse rounded-full bg-emerald-600" />
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={bulkRunning}
                onClick={() => void runBulkCapture()}
                className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 ${focusRing}`}
              >
                {bulkRunning ? "Capturing…" : `Capture payment for ${instapaySelected.size} orders`}
              </button>
              <button
                type="button"
                onClick={() => setInstapaySelected(new Set())}
                className={`rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 ${focusRing}`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkResults && bulkResults.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-30 max-h-48 overflow-y-auto border-t border-neutral-200 bg-white p-3 text-sm shadow dark:border-neutral-800 dark:bg-neutral-950">
          <p className="font-medium">Last bulk capture</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {bulkResults.map((r) => (
              <li key={r.order_id} className={r.ok ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}>
                {r.order_id.slice(0, 12)}… {r.ok ? "ok" : r.error || "failed"}
              </li>
            ))}
          </ul>
          <button type="button" className="mt-2 text-xs underline" onClick={() => setBulkResults(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {showGuideModal ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="presentation">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={() => setShowGuideModal(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">How this dashboard works</h3>
            {scheduleDay ? (
              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/90 p-3 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
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
            <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/80 p-3 text-sm text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/35 dark:text-violet-100">
              <p className="font-medium">Instapay pipeline (loaded orders)</p>
              <p className="mt-1 text-xs text-violet-900/95 dark:text-violet-200/90">
                <strong>1 — Awaiting capture:</strong> customer chose Instapay; money is not marked captured in Medusa yet. After the transfer clears, open the
                order and run <strong>Capture payment</strong>. <strong>2 — Ready to ship:</strong> payment is captured; use <strong>Create fulfillment</strong>{" "}
                then mark delivered as usual.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className={`mt-5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900 ${focusRing}`}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {showShortcuts ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="presentation">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={() => setShowShortcuts(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-lg font-semibold">Keyboard shortcuts</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">?</kbd> — This help
              </li>
              <li>
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">r</kbd> — Refresh dashboard
              </li>
              <li>
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">/</kbd> — Focus search
              </li>
              <li>
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">g</kbd> then <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">t</kbd> — Jump to “What to do today”
              </li>
              <li>
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">g</kbd> then <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">c</kbd> — Jump to InstaPay capture
              </li>
              <li>
                In order tables (when a row is focused): <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">↑</kbd> /{" "}
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">↓</kbd> or <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">k</kbd> /{" "}
                <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">j</kbd> — Move between rows; <kbd className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">Enter</kbd> opens the order
              </li>
            </ul>
            <button type="button" className="mt-4 text-sm font-medium text-sky-700 underline dark:text-sky-300" onClick={() => setShowShortcuts(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

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
