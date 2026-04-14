/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Medusa API origin for admin widgets (e.g. `http://localhost:9000`). See `src/admin/README.md`. */
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
