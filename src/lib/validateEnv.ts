interface EnvVars {
  VITE_WALLETCONNECT_PROJECT_ID: string;
  VITE_USDC_ADDRESS: string;
  VITE_TOKEN_ADDRESS: string;
  VITE_TREASURY_ADDRESS: string;
  VITE_GOVERNANCE_ADDRESS: string;
  VITE_PERSONALFUNDFACTORY_ADDRESS: string;
  VITE_API_URL?: string;
}

const REQUIRED_ENV_VARS: (keyof EnvVars)[] = [
  'VITE_WALLETCONNECT_PROJECT_ID',
  'VITE_USDC_ADDRESS',
  'VITE_TOKEN_ADDRESS',
  'VITE_TREASURY_ADDRESS',
  'VITE_GOVERNANCE_ADDRESS',
  'VITE_PERSONALFUNDFACTORY_ADDRESS',
];

const OPTIONAL_ENV_VARS: (keyof EnvVars)[] = [
  'VITE_API_URL',
];

export function validateEnv(): void {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  REQUIRED_ENV_VARS.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });

  OPTIONAL_ENV_VARS.forEach((varName) => {
    if (!import.meta.env[varName]) {
      warnings.push(varName);
    }
  });

  if (warnings.length > 0) {
    console.warn(
      '⚠️ Optional environment variables not set:\n' +
      warnings.map(v => `  - ${v}`).join('\n')
    );
  }

  if (missingVars.length > 0) {
    throw new Error(
      '❌ Missing required environment variables:\n' +
      missingVars.map(v => `  - ${v}`).join('\n') +
      '\n\nPlease check your .env file.'
    );
  }

  console.log('✅ Environment variables validated successfully');
}

export function getEnv(key: keyof EnvVars, fallback?: string): string {
  const value = import.meta.env[key];
  
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is not defined and no fallback provided`);
  }
  
  return value;
}

export const CONTRACT_ADDRESSES = {
  usdc: import.meta.env.VITE_USDC_ADDRESS as `0x${string}`,
  token: import.meta.env.VITE_TOKEN_ADDRESS as `0x${string}`,
  treasury: import.meta.env.VITE_TREASURY_ADDRESS as `0x${string}`,
  governance: import.meta.env.VITE_GOVERNANCE_ADDRESS as `0x${string}`,
  factory: import.meta.env.VITE_PERSONALFUNDFACTORY_ADDRESS as `0x${string}`,
} as const;

export const API_URL = getEnv('VITE_API_URL', 'http://localhost:4000');
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;

if (import.meta.env.PROD) {
  try {
    validateEnv();
  } catch (error) {
    console.error(error);
  }
}