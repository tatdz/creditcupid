/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLOCKSCOUT_API_KEY: string
  readonly VITE_ETHERSCAN_API_KEY: string
  // add other env variables you use in your project
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}