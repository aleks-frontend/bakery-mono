/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BREAD_TYPES_URL: string
  readonly VITE_ORDER_SUBMIT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
