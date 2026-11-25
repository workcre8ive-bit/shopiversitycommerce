import React from "react";
import { ExchangeRateSnapshot, OneDollarListing } from "../types";

const RATE_CACHE_KEY = "shopiversity_one_dollar_rate_v1";
const LISTINGS_CACHE_KEY = "shopiversity_one_dollar_listings_v1";
const CLIENT_TTL_MS = 30 * 60 * 1000; // Re-check server cache every 30 min (server enforces 24h daily API refresh)

export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₦${safe.toLocaleString("en-NG")}`;
}

export function clampOneDollarUsd(usd: number | undefined | null): number {
  const numeric = Number(usd);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  return Math.min(1, Math.max(0.01, Math.round(numeric * 100) / 100));
}

export function formatUsd(usd: number | undefined | null): string {
  const clamped = clampOneDollarUsd(usd);
  return `$${clamped.toFixed(2)}`;
}

export function computeOneDollarNgn(
  usd: number | undefined | null,
  rateInfo: ExchangeRateSnapshot | null | undefined
): number | null {
  if (!rateInfo || !Number.isFinite(rateInfo.rate) || rateInfo.rate <= 0) {
    return null;
  }
  const clamped = clampOneDollarUsd(usd);
  if (clamped === 1 && Number.isFinite(rateInfo.oneDollarNgnPrice) && rateInfo.oneDollarNgnPrice > 0) {
    return rateInfo.oneDollarNgnPrice;
  }
  return Math.max(1, Math.round(clamped * rateInfo.rate));
}

export function getCachedExchangeRate(): ExchangeRateSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: ExchangeRateSnapshot; savedAt: number };
    if (parsed?.data && typeof parsed.data.oneDollarNgnPrice === "number" && parsed.data.oneDollarNgnPrice > 0) {
      return parsed.data;
    }
  } catch {}
  return null;
}

export function setCachedExchangeRate(snapshot: ExchangeRateSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ data: snapshot, savedAt: Date.now() }));
  } catch {}
}

export async function fetchOneDollarExchangeRate(forceRefresh = false): Promise<ExchangeRateSnapshot> {
  if (!forceRefresh && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(RATE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: ExchangeRateSnapshot; savedAt: number };
        if (
          parsed?.data &&
          typeof parsed.data.oneDollarNgnPrice === "number" &&
          parsed.data.oneDollarNgnPrice > 0 &&
          Date.now() - parsed.savedAt < CLIENT_TTL_MS &&
          new Date(parsed.data.nextRefreshAt).getTime() > Date.now()
        ) {
          return parsed.data;
        }
      }
    } catch {}
  }

  const url = forceRefresh ? "/api/one-dollar/exchange-rate?refresh=true" : "/api/one-dollar/exchange-rate";
  const resp = await fetch(url);
  const json = await resp.json();
  if (!resp.ok || !json?.success) {
    const fallback = getCachedExchangeRate();
    if (fallback) {
      return { ...fallback, cached: true, staleFallback: true };
    }
    throw new Error(json?.error || "Unable to fetch daily USD to NGN exchange rate.");
  }

  const snapshot: ExchangeRateSnapshot = {
    usdAmount: 1,
    rate: Number(json.rate),
    oneDollarNgnPrice: Number(json.oneDollarNgnPrice),
    source: String(json.source || "ExchangeRate-API"),
    updatedAt: String(json.updatedAt || new Date().toISOString()),
    nextRefreshAt: String(json.nextRefreshAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
    cached: Boolean(json.cached),
    staleFallback: Boolean(json.staleFallback)
  };
  setCachedExchangeRate(snapshot);
  return snapshot;
}

export function useOneDollarRate() {
  const [rateInfo, setRateInfo] = React.useState<ExchangeRateSnapshot | null>(() => getCachedExchangeRate());
  const [loading, setLoading] = React.useState<boolean>(() => !getCachedExchangeRate());
  const [error, setError] = React.useState<string | null>(null);

  const loadRate = React.useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOneDollarExchangeRate(force);
      setRateInfo(data);
    } catch (err: any) {
      setError(err?.message || "Exchange rate unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRate(false);
  }, [loadRate]);

  return {
    rateInfo,
    loading,
    error,
    refreshRate: () => loadRate(true)
  };
}

export function getCachedOneDollarListings(): OneDollarListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTINGS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCachedOneDollarListings(listings: OneDollarListing[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(listings.slice(0, 80)));
  } catch {}
}
