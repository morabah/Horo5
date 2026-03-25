/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HORO_SUPPORT_EFFECTIVE_DATE?: string;
  readonly VITE_HORO_INSTAGRAM_URL?: string;
  readonly VITE_HORO_WHATSAPP_SUPPORT_URL?: string;
  readonly VITE_HORO_WHATSAPP_TRACKING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
