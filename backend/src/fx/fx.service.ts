import { Injectable, Logger } from '@nestjs/common';

const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const TTL_MS = 12 * 60 * 60 * 1000;

const FALLBACK_RATES_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  COP: 4000,
  MXN: 17.5,
  ARS: 1000,
  BRL: 5,
  CLP: 950,
  PEN: 3.7,
};

interface RatesSnapshot {
  base: 'USD';
  rates: Record<string, number>;
  fetchedAt: number;
  source: 'api' | 'fallback';
}

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private cache: RatesSnapshot | null = null;
  private inflight: Promise<RatesSnapshot> | null = null;

  async getRates(): Promise<RatesSnapshot> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < TTL_MS) {
      return this.cache;
    }
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      try {
        const res = await fetch(FX_URL);
        if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
        const data: any = await res.json();
        if (data?.result !== 'success' || !data?.rates) {
          throw new Error('FX bad payload');
        }
        const snapshot: RatesSnapshot = {
          base: 'USD',
          rates: data.rates,
          fetchedAt: now,
          source: 'api',
        };
        this.cache = snapshot;
        this.logger.log('FX rates refreshed from open.er-api.com');
        return snapshot;
      } catch (err: any) {
        this.logger.warn(`FX fetch failed (${err?.message}); using fallback rates`);
        const snapshot: RatesSnapshot = {
          base: 'USD',
          rates: { ...FALLBACK_RATES_USD },
          fetchedAt: now,
          source: 'fallback',
        };
        if (!this.cache) this.cache = snapshot;
        return this.cache;
      } finally {
        this.inflight = null;
      }
    })();

    return this.inflight;
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (!Number.isFinite(amount)) return 0;
    if (!from || !to || from === to) return amount;
    const { rates } = await this.getRates();
    const fromRate = rates[from];
    const toRate = rates[to];
    if (!fromRate || !toRate) return amount;
    const inUsd = amount / fromRate;
    return inUsd * toRate;
  }

  async convertMany(
    items: Array<{ amount: number; currency: string }>,
    targetCurrency: string,
  ): Promise<number[]> {
    const { rates } = await this.getRates();
    const targetRate = rates[targetCurrency];
    return items.map((it) => {
      if (!Number.isFinite(it.amount)) return 0;
      if (!it.currency || it.currency === targetCurrency) return it.amount;
      const fromRate = rates[it.currency];
      if (!fromRate || !targetRate) return it.amount;
      return (it.amount / fromRate) * targetRate;
    });
  }
}
