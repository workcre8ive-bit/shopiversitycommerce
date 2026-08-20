import PaystackPop from "@paystack/inline-js";

export interface PaystackConfig {
  publicKey: string;
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
  return (
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
      const key = mergedConfig.publicKey || (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_PAYSTACK_PUBLIC_KEY : "") || "";
      const ref = mergedConfig.reference || mergedConfig.ref || `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const amount = Math.round(mergedConfig.amount);

      if (!key) {
        alert("Paystack Public Key is not configured. Please provide a valid VITE_PAYSTACK_PUBLIC_KEY in your settings or environment variables.");
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

