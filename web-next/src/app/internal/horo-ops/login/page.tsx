"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HoroOpsLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/horo-ops/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message || res.statusText);
        setPending(false);
        return;
      }
      router.replace("/internal/horo-ops");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">HORO ops sign-in</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Staff only. Not part of the public storefront.</p>
        <form className="mt-6 space-y-4" onSubmit={submit} autoComplete="on">
          <input
            type="text"
            name="username"
            autoComplete="username"
            defaultValue="horo-ops"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div>
            <label htmlFor="horo-ops-password" className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Password
            </label>
            <input
              id="horo-ops-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
