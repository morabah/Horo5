'use client';

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { DICTIONARY } from './dictionary';

export type UiLocale = 'en' | 'ar';
export type UiDirection = 'ltr' | 'rtl';

export const UI_LOCALE_STORAGE_KEY = 'horo-ui-locale';
export const UI_LOCALE_COOKIE_KEY = 'horo-ui-locale';
const UI_LOCALE_QUERY_KEY = 'uiLocale';

type UiLocaleContextValue = {
  locale: UiLocale;
  dir: UiDirection;
  setLocale: (locale: UiLocale) => void;
};

const UiLocaleContext = createContext<UiLocaleContextValue | null>(null);

function isUiLocale(value: string | null | undefined): value is UiLocale {
  return value === 'en' || value === 'ar';
}

function getDirection(locale: UiLocale): UiDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

function resolveInitialLocale(): UiLocale {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const queryLocale = params.get(UI_LOCALE_QUERY_KEY);
  if (isUiLocale(queryLocale)) return queryLocale;
  try {
    const stored = window.localStorage.getItem(UI_LOCALE_STORAGE_KEY);
    if (isUiLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

type UiLocaleProviderProps = PropsWithChildren<{
  /** Server-read cookie so first paint matches user preference (fixes EN flash). */
  initialLocale?: UiLocale;
}>;

function persistLocaleCookie(locale: UiLocale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${UI_LOCALE_COOKIE_KEY}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function UiLocaleProvider({ children, initialLocale = 'en' }: UiLocaleProviderProps) {
  const [locale, setLocaleState] = useState<UiLocale>(initialLocale);

  useEffect(() => {
    const resolved = resolveInitialLocale();
    if (resolved !== initialLocale) {
      setLocaleState(resolved);
    }
  }, [initialLocale]);

  const setLocale = (nextLocale: UiLocale) => {
    setLocaleState(nextLocale);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set(UI_LOCALE_QUERY_KEY, nextLocale);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryLocale = params.get(UI_LOCALE_QUERY_KEY);
    if (isUiLocale(queryLocale) && queryLocale !== locale) {
      setLocale(queryLocale);
    }
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
    persistLocaleCookie(locale);
    try {
      window.localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo<UiLocaleContextValue>(
    () => ({
      locale,
      dir: getDirection(locale),
      setLocale,
    }),
    [locale],
  );

  return <UiLocaleContext.Provider value={value}>{children}</UiLocaleContext.Provider>;
}

export function useUiLocale() {
  const context = useContext(UiLocaleContext);
  if (!context) {
    throw new Error('useUiLocale must be used within UiLocaleProvider');
  }
  return context;
}

export function useDictionary() {
  const { locale } = useUiLocale();
  return DICTIONARY[locale];
}
