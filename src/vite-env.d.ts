/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {

  readonly VITE_TOKEN_ADDRESS?: string;
  readonly VITE_TREASURY_ADDRESS?: string;
  readonly VITE_GOVERNANCE_ADDRESS?: string;
  readonly VITE_PERSONAL_FUND_ADDRESS?: string;
  readonly VITE_PERSONALFUNDFACTORY_ADDRESS?: string;
  readonly VITE_PROTOCOL_REGISTRY_ADDRESS?: string;
  readonly VITE_PROTOCOLREGISTRY_ADDRESS?: string;
  readonly VITE_USER_PREFERENCES_ADDRESS?: string;
  readonly VITE_USERPREFERENCES_ADDRESS?: string;
  readonly VITE_USDC_ADDRESS?: string;
  readonly VITE_ADMIN_ADDRESS?: string;

  readonly VITE_CHAIN_ID?: string;

  readonly VITE_ARBITRUM_SEPOLIA_RPC?: string;
  readonly VITE_SEPOLIA_RPC?: string;
  readonly VITE_ZKSYNC_SEPOLIA_RPC?: string;

  readonly VITE_API_URL?: string;

  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: 'development' | 'production' | 'staging';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}