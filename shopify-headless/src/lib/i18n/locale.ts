import { env } from "@/lib/env";
import type { SupportedLocale } from "@/lib/i18n/dictionary";

export function getDefaultLocale(): SupportedLocale {
  return env.NEXT_PUBLIC_DEFAULT_LOCALE === "ar" ? "ar" : "en";
}

export function dirForLocale(locale: SupportedLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

