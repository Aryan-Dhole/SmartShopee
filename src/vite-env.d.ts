/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Add more VITE_ env vars here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
