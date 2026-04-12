"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from "../../../web/src/data/domain-config";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const whatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
        ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
        : null;

      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center md:py-24">
          <h1 className="font-headline text-2xl font-semibold text-obsidian md:text-3xl">Something went wrong</h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-warm-charcoal">
            This page hit an unexpected error. Try reloading, go home, or reach us on WhatsApp if it keeps happening.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="font-label inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-xl border border-obsidian bg-obsidian px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-obsidian/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <a
              href="/"
              className="font-label inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-xl border border-stone bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:border-desert-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              Home
            </a>
          </div>
          {whatsappUrl ? (
            <p className="mt-8 font-body text-sm text-clay">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-deep-teal underline decoration-deep-teal/35 underline-offset-4"
              >
                WhatsApp support
              </a>
            </p>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}
