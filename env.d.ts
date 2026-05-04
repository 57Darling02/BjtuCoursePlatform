/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_DEV_PASSPHRASE_MD5: string
  readonly VITE_DEV_HELPER_USE_FIXED: string
  readonly VITE_DEV_HELPER_USERNAME: string
  readonly VITE_DEV_HELPER_PASSWORD: string
}
