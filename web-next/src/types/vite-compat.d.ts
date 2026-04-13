interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}

interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_HORO_SUPPORT_EFFECTIVE_DATE?: string;
  readonly VITE_HORO_INSTAGRAM_URL?: string;
  readonly VITE_HORO_WHATSAPP_SUPPORT_URL?: string;
  readonly VITE_HORO_WHATSAPP_TRACKING_URL?: string;
  readonly VITE_MEDUSA_BACKEND_URL?: string;
  readonly VITE_MEDUSA_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
