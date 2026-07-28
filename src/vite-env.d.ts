/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
  // add other variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
