/**
 * Shared, locale-agnostic utilities.
 *
 * Money / date formatting and translatable labels live in `./i18n`.
 * `formatMoney` and `formatDate` are re-exported here to keep existing
 * import sites stable.
 */
export { formatMoney, formatDate } from './i18n';

/** Currency codes available across the app. Display label is translated
 *  via the `currencies.<code>` i18n key. */
export const CURRENCIES = [
  { code: 'COP', symbol: '$' },
  { code: 'USD', symbol: 'US$' },
  { code: 'EUR', symbol: '€' },
  { code: 'MXN', symbol: 'MX$' },
  { code: 'ARS', symbol: 'AR$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'CLP', symbol: 'CL$' },
  { code: 'PEN', symbol: 'S/' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

const AVATAR_COLORS = [
  '#fbbf24',
  '#34d399',
  '#60a5fa',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#22d3ee',
  '#facc15',
];

export function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const FX_TTL_MS = 12 * 60 * 60 * 1000;
let fxCache: { rates: Record<string, number>; fetchedAt: number } | null =
  null;

export async function getRatesUSD(): Promise<Record<string, number> | null> {
  if (fxCache && Date.now() - fxCache.fetchedAt < FX_TTL_MS)
    return fxCache.rates;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('fx http');
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data?.result !== 'success' || !data?.rates)
      throw new Error('fx payload');
    fxCache = { rates: data.rates, fetchedAt: Date.now() };
    return fxCache.rates;
  } catch {
    return null;
  }
}

export async function convertAmount(
  amount: number,
  from: string,
  to: string,
): Promise<number | null> {
  if (!Number.isFinite(amount) || from === to) return amount;
  const rates = await getRatesUSD();
  if (!rates || !rates[from] || !rates[to]) return null;
  return (amount / rates[from]) * rates[to];
}
