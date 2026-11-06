/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_LIVE_PUBLIC_KEY?: string;
  readonly live_public_key?: string;
  // add other variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
