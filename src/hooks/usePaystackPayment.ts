import PaystackPop from "@paystack/inline-js";

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number;
  reference?: string;
  ref?: string;
  currency?: string;
  metadata?: any;
  [key: string]: any;
}

export interface PaystackCallbacks {
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

    if (typeof optionsOrSuccess === "function") {
      onSuccessHandler = optionsOrSuccess;
      onCloseHandler = onCloseParam;
    } else if (optionsOrSuccess && typeof optionsOrSuccess === "object") {
      onSuccessHandler = optionsOrSuccess.onSuccess;
      onCloseHandler = optionsOrSuccess.onClose;
    }

    try {
      const paystack = new PaystackPop();
      const key = config.publicKey || (import.meta.env ? import.meta.env.VITE_PAYSTACK_PUBLIC_KEY : "") || "";
      const ref = config.reference || config.ref || new Date().getTime().toString();

      paystack.newTransaction({
        ...config,
        key,
        email: config.email,
        amount: config.amount,
        ref,
        reference: ref,
        currency: config.currency || "NGN",
        metadata: config.metadata,
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
    } catch (err) {
      console.error("Paystack initialization failed:", err);
      // Fallback popup or alert if key or network issues occur
      if (onCloseHandler) {
        onCloseHandler();
      }
    }
  };
}

export default usePaystackPayment;
