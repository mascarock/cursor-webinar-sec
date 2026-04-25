export const CURRENCIES = [
  { code: 'COP', symbol: '$', label: 'Peso colombiano' },
  { code: 'USD', symbol: 'US$', label: 'Dólar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'MXN', symbol: 'MX$', label: 'Peso mexicano' },
  { code: 'ARS', symbol: 'AR$', label: 'Peso argentino' },
  { code: 'BRL', symbol: 'R$', label: 'Real brasileño' },
  { code: 'CLP', symbol: 'CL$', label: 'Peso chileno' },
  { code: 'PEN', symbol: 'S/', label: 'Sol peruano' },
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

export function formatMoney(amount: number, currency = 'COP'): string {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    maximumFractionDigits: ['COP', 'CLP'].includes(currency) ? 0 : 2,
  };
  try {
    return new Intl.NumberFormat('es-CO', opts).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

export function plural(
  count: number,
  singular: string,
  pluralForm: string,
): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
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
