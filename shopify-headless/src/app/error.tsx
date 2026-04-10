"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/events";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    trackEvent({
      event: "frontend_error",
      message: error.message,
      digest: error.digest ?? "none",
    });
  }, [error.digest, error.message]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <section className="rounded-2xl border border-red-300 bg-red-50 p-8">
        <h1 className="text-2xl font-bold text-red-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-red-800">
          We hit an unexpected issue while loading this page. Please retry.
        </p>
        <button
          type="button"
          className="mt-5 rounded-full bg-red-900 px-5 py-2 text-sm font-semibold text-white"
          onClick={reset}
        >
          Retry
        </button>
      </section>
    </main>
  );
}
