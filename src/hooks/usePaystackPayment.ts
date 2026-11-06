import PaystackPop from "@paystack/inline-js";
import { getPaystackPublicKey, getSyncPaystackPublicKey } from "../utils/paystackConfig";

export interface PaystackConfig {
  publicKey?: string;
  email: string;
  amount: number; // In kobo (amount in Naira * 100)
  reference?: string;
  ref?: string;
  currency?: string;
  metadata?: any;
  [key: string]: any;
}

export interface PaystackCallbacks extends Partial<PaystackConfig> {
  onSuccess?: (response: any) => void;
  onClose?: () => void;
}

export function usePaystackPayment(config: PaystackConfig) {
  return async (
    optionsOrSuccess?: PaystackCallbacks | ((response: any) => void),
    onCloseParam?: () => void
  ) => {
    let onSuccessHandler: ((response: any) => void) | undefined;
    let onCloseHandler: (() => void) | undefined;
    let overrideConfig: Partial<PaystackConfig> = {};

    if (typeof optionsOrSuccess === "function") {
      onSuccessHandler = optionsOrSuccess;
      onCloseHandler = onCloseParam;
    } else if (optionsOrSuccess && typeof optionsOrSuccess === "object") {
      onSuccessHandler = optionsOrSuccess.onSuccess;
      onCloseHandler = optionsOrSuccess.onClose;
      const { onSuccess: _s, onClose: _c, ...rest } = optionsOrSuccess;
      overrideConfig = rest;
    }

    try {
      const mergedConfig = { ...config, ...overrideConfig };
      
      // 1. Check synchronous config and client environment
      let key = (mergedConfig.publicKey || getSyncPaystackPublicKey() || "").trim();

      // 2. If not yet resolved, asynchronously retrieve from backend endpoint (e.g. live_public_key on server)
      if (!key) {
        key = (await getPaystackPublicKey()).trim();
      }

      const ref = mergedConfig.reference || mergedConfig.ref || `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const amount = Math.round(mergedConfig.amount);

      if (!key) {
        alert(
          "Paystack Public Key is not configured.\n\n" +
          "Please add VITE_PAYSTACK_PUBLIC_KEY (or live_public_key) to your Vercel Environment Variables and redeploy."
        );
        if (onCloseHandler) onCloseHandler();
        return;
      }

      if (!mergedConfig.email) {
        alert("Buyer email address is required to initiate real Paystack payment.");
        if (onCloseHandler) onCloseHandler();
        return;
      }

      const paystack = new PaystackPop();

      paystack.newTransaction({
        ...mergedConfig,
        key,
        email: mergedConfig.email,
        amount,
        ref,
        reference: ref,
        currency: mergedConfig.currency || "NGN",
        metadata: mergedConfig.metadata || {},
        onSuccess: (transaction: any) => {
          if (onSuccessHandler) {
            onSuccessHandler(transaction);
          }
        },
        onCancel: () => {
          if (onCloseHandler) {
            onCloseHandler();
          }
        },
        onClose: () => {
          if (onCloseHandler) {
            onCloseHandler();
          }
        },
      });
    } catch (err: any) {
      console.error("Paystack initialization failed:", err);
      alert(`Unable to open Paystack payment window: ${err?.message || err}`);
      if (onCloseHandler) {
        onCloseHandler();
      }
    }
  };
}

export default usePaystackPayment;
