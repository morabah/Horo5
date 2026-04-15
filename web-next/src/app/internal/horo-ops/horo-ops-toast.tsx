"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function HoroOpsToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = "info", durationMs = 4200) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => (
          <ToastBanner key={t.id} message={t.message} kind={t.kind} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBanner({ message, kind }: { message: string; kind: ToastKind }) {
  const border =
    kind === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-50"
      : kind === "error"
        ? "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/90 dark:text-red-50"
        : "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/90 dark:text-sky-50";
  return (
    <div
      className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${border}`}
      role="status"
    >
      {message}
    </div>
  );
}

export function useHoroOpsToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}

/** Dev-only: assert provider mounted */
export function useHoroOpsToastStrict(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useHoroOpsToastStrict requires HoroOpsToastProvider");
  return ctx;
}
