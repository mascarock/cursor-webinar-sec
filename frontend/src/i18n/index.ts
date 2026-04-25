import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import en from './locales/en';
import es from './locales/es';

/* ─────────────── Configuration ─────────────── */

/**
 * To add a new locale:
 *   1. Create `./locales/<code>.ts` mirroring `en.ts` (use the
 *      `DeepPartial<Messages>` pattern from `es.ts` so partial
 *      translations fall back to English).
 *   2. Import it here and add an entry to `LOCALES`.
 *   3. The new option appears automatically in the language switcher.
 */
export const DEFAULT_LOCALE = 'en' as const;

export const LOCALES = {
  en: { messages: en, intlTag: 'en-US' },
  es: { messages: es, intlTag: 'es-CO' },
} as const;

export type Locale = keyof typeof LOCALES;

const STORAGE_KEY = 'finfam.locale';

/* ─────────────── Translation lookup ─────────────── */

type AnyMessages = Record<string, unknown>;

function lookup(messages: AnyMessages, dottedKey: string): string | undefined {
  const parts = dottedKey.split('.');
  let cursor: unknown = messages;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : '{' + key + '}',
  );
}

export type TFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

function buildT(locale: Locale): TFn {
  const primary = LOCALES[locale].messages as AnyMessages;
  const fallback = LOCALES[DEFAULT_LOCALE].messages as AnyMessages;

  return function t(key, vars) {
    const tryKey = (k: string) => lookup(primary, k) ?? lookup(fallback, k);

    let value: string | undefined;
    if (vars && typeof vars.count === 'number') {
      const suffix = vars.count === 1 ? '_one' : '_other';
      value = tryKey(key + suffix);
    }
    if (value == null) value = tryKey(key);
    if (value == null) return key;

    return vars ? interpolate(value, vars) : value;
  };
}

/* ─────────────── Locale-aware formatters ─────────────── */

/**
 * Module-level current locale, kept in sync with the React context. This
 * lets pure helpers like `formatMoney` / `formatDate` stay non-hook while
 * still respecting the active language.
 */
let _currentLocale: Locale = DEFAULT_LOCALE;

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && stored in LOCALES) return stored as Locale;
  const browser = (navigator.language || '').toLowerCase().split('-')[0];
  if (browser in LOCALES) return browser as Locale;
  return DEFAULT_LOCALE;
}

export function getLocale(): Locale {
  return _currentLocale;
}

export function intlTag(locale: Locale = _currentLocale): string {
  return LOCALES[locale].intlTag;
}

export function formatMoney(amount: number, currency = 'COP'): string {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    maximumFractionDigits: ['COP', 'CLP'].includes(currency) ? 0 : 2,
  };
  try {
    return new Intl.NumberFormat(intlTag(), opts).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString(intlTag(), {
    day: '2-digit',
    month: 'short',
  });
}

/* ─────────────── React context / hook ─────────────── */

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
  available: Locale[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  useEffect(() => {
    _currentLocale = locale;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    if (next in LOCALES) setLocaleState(next);
  }, []);

  const t = useMemo(() => buildT(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      available: Object.keys(LOCALES) as Locale[],
    }),
    [locale, setLocale, t],
  );

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}

/** Convenience hook when only the `t()` function is needed. */
export function useT(): TFn {
  return useLocale().t;
}
