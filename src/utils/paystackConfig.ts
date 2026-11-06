/**
 * Paystack Public & Client Key Resolution Utility
 * 
 * Supports:
 * 1. Build-time Vite client variables:
 *    - import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
 *    - import.meta.env.VITE_LIVE_PUBLIC_KEY
 * 2. Runtime backend fallback endpoint (/api/paystack/public-key):
 *    - Resolves 'live_public_key' or 'PAYSTACK_PUBLIC_KEY' set in Vercel server environment.
 * 
 * This ensures that even if environment variables in Vercel do not have the 'VITE_' prefix,
 * the frontend automatically retrieves and caches the public key without errors.
 */

let cachedPublicKey: string | null = null;
let fetchPromise: Promise<string> | null = null;

/**
 * Returns the synchronously available public key from Vite's import.meta.env
 */
export function getSyncPaystackPublicKey(): string {
  try {
    const metaEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : ({} as any);
    const key = (
      metaEnv.VITE_PAYSTACK_PUBLIC_KEY ||
      metaEnv.VITE_LIVE_PUBLIC_KEY ||
      (metaEnv as any).live_public_key ||
      (metaEnv as any).LIVE_PUBLIC_KEY ||
      ""
    ).trim();

    if (key) return key;
  } catch (err) {
    // Ignore meta env access issues
  }

  if (cachedPublicKey) return cachedPublicKey;
  return "";
}

/**
 * Asynchronously retrieves the Paystack Public Key.
 * Checks client environment variables first, then queries the backend proxy endpoint.
 */
export async function getPaystackPublicKey(): Promise<string> {
  const syncKey = getSyncPaystackPublicKey();
  if (syncKey) {
    cachedPublicKey = syncKey;
    return syncKey;
  }

  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch("/api/paystack/public-key");
      if (response.ok) {
        const data = await response.json();
        if (data?.publicKey && typeof data.publicKey === "string" && data.publicKey.trim().length > 0) {
          const fetched = data.publicKey.trim();
          cachedPublicKey = fetched;
          return fetched;
        }
      }
    } catch (err) {
      console.warn("[PAYSTACK CONFIG] Failed to fetch public key from backend endpoint:", err);
    } finally {
      fetchPromise = null;
    }

    return "";
  })();

  return fetchPromise;
}
