import { arbitrum, arbitrumSepolia, mainnet, sepolia } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

export type Environment = 'development' | 'staging' | 'production';
export type SupportedChainId = 1 | 11155111 | 42161 | 421614 | 31337;

export interface ContractAddresses {
  personalFundFactory: `0x${string}`;
  usdc: `0x${string}`;
  treasury: `0x${string}`;
  governance: `0x${string}`;
  token: `0x${string}`;
  protocolRegistry?: `0x${string}`;
  userPreferences?: `0x${string}`;
}

export interface ChainConfig {
  id: SupportedChainId;
  chain: Chain;
  name: string;
  isTestnet: boolean;
  explorerUrl: string;
  faucetUrl?: string;
  rpcUrl: string;
  contracts: ContractAddresses;
}

export interface AppConfig {
  env: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  apiUrl: string;
  chain: ChainConfig;
}

const ANVIL_CHAIN: Chain = {
  id: 31337,
  name: 'Anvil (Local)',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

export const SUPPORTED_CHAINS: Record<SupportedChainId, Chain> = {
  1: mainnet,
  11155111: sepolia,
  42161: arbitrum,
  421614: arbitrumSepolia,
  31337: ANVIL_CHAIN,
};

const CHAIN_CONFIGS: Record<SupportedChainId, Omit<ChainConfig, 'contracts'>> = {
  // Ethereum Mainnet
  1: {
    id: 1,
    chain: mainnet,
    name: 'Ethereum Mainnet',
    isTestnet: false,
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://eth.llamarpc.com',
  },
  
  // Sepolia Testnet
  11155111: {
    id: 11155111,
    chain: sepolia,
    name: 'Sepolia Testnet',
    isTestnet: true,
    explorerUrl: 'https://sepolia.etherscan.io',
    faucetUrl: 'https://sepoliafaucet.com',
    rpcUrl: 'https://rpc.sepolia.org',
  },
  
  // Arbitrum Mainnet
  42161: {
    id: 42161,
    chain: arbitrum,
    name: 'Arbitrum One',
    isTestnet: false,
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  
  // Arbitrum Sepolia
  421614: {
    id: 421614,
    chain: arbitrumSepolia,
    name: 'Arbitrum Sepolia',
    isTestnet: true,
    explorerUrl: 'https://sepolia.arbiscan.io',
    faucetUrl: 'https://faucet.quicknode.com/arbitrum/sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
  
  // Anvil Local
  31337: {
    id: 31337,
    chain: ANVIL_CHAIN,
    name: 'Anvil (Local)',
    isTestnet: true,
    explorerUrl: 'http://localhost:8545',
    faucetUrl: 'http://localhost:8545',
    rpcUrl: 'http://127.0.0.1:8545',
  },
};

class ConfigError extends Error {
  constructor(message: string) {
    super(`[Config Error] ${message}`);
    this.name = 'ConfigError';
  }
}

const getEnvVar = (key: string, required = true): string => {
  const value = import.meta.env[key];
  
  if (!value && required) {
    throw new ConfigError(
      `Missing required environment variable: ${key}\n` +
      `Please add it to your .env.local file`
    );
  }
  
  return value || '';
};

const validateAddress = (address: string, name: string): `0x${string}` => {
  if (!address) {
    throw new ConfigError(`Missing contract address: ${name}`);
  }
  
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new ConfigError(
      `Invalid ${name} address: ${address}\n` +
      `Address must be 42 characters long and start with 0x`
    );
  }
  
  return address as `0x${string}`;
};

const parseChainId = (value: string): SupportedChainId => {
  const chainId = parseInt(value);
  
  if (isNaN(chainId)) {
    throw new ConfigError(`Invalid VITE_CHAIN_ID: ${value} (must be a number)`);
  }
  
  if (!(chainId in SUPPORTED_CHAINS)) {
    throw new ConfigError(
      `Unsupported chain ID: ${chainId}\n` +
      `Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`
    );
  }
  
  return chainId as SupportedChainId;
};

const loadContractAddresses = (chainId: SupportedChainId): ContractAddresses => {

  const prefix = chainId === 31337 ? 'LOCAL' : '';
  const getContractAddress = (name: string, required = true) => {
    const envKey = `VITE_${prefix ? `${prefix}_` : ''}${name}_ADDRESS`;
    const value = getEnvVar(envKey, required);
    return required ? validateAddress(value, name) : (value as `0x${string}` | undefined);
  };

  return {
    personalFundFactory: getContractAddress('PERSONALFUNDFACTORY'),
    usdc: getContractAddress('USDC'),
    treasury: getContractAddress('TREASURY'),
    governance: getContractAddress('GOVERNANCE'),
    token: getContractAddress('TOKEN'),
    protocolRegistry: getContractAddress('PROTOCOLREGISTRY', false),
    userPreferences: getContractAddress('USERPREFERENCES', false),
  };
};

const loadConfig = (): AppConfig => {
  // Environment
  const nodeEnv = import.meta.env.MODE || 'development';
  const env: Environment = 
    nodeEnv === 'production' ? 'production' :
    nodeEnv === 'staging' ? 'staging' :
    'development';

  const chainIdStr = getEnvVar('VITE_CHAIN_ID', true);
  const chainId = parseChainId(chainIdStr);
  const chainBaseConfig = CHAIN_CONFIGS[chainId];

  let contracts: ContractAddresses;
  try {
    contracts = loadContractAddresses(chainId);
  } catch (error) {
    console.error('❌ Error loading contract addresses:', error);
    throw error;
  }

  // API URL
  const apiUrl = getEnvVar('VITE_API_URL', false) || 'http://localhost:8000';

  return {
    env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    apiUrl,
    chain: {
      ...chainBaseConfig,
      contracts,
    },
  };
};
let config: AppConfig;

try {
  config = loadConfig();

  if (config.isDevelopment) {
    console.log('✅ Configuration loaded:', {
      env: config.env,
      chain: config.chain.name,
      chainId: config.chain.id,
      apiUrl: config.apiUrl,
    });
  }
} catch (error) {
  console.error('❌ Failed to load configuration:', error);
  throw error;
}

export const appConfig = config;
export const getChainConfig = () => appConfig.chain;

export const getContractAddress = (name: keyof ContractAddresses): `0x${string}` => {
  const address = appConfig.chain.contracts[name];
  if (!address) {
    throw new ConfigError(`Contract address not found: ${name}`);
  }
  return address;
};

export const isValidChain = (chainId: number): boolean => {
  return chainId === appConfig.chain.id;
};

export const getExplorerUrl = (txHash?: string): string => {
  const base = appConfig.chain.explorerUrl;
  return txHash ? `${base}/tx/${txHash}` : base;
};

export const getExplorerAddressUrl = (address: string): string => {
  return `${appConfig.chain.explorerUrl}/address/${address}`;
};

export const getFaucetUrl = (): string | undefined => {
  return appConfig.chain.faucetUrl;
};

export const getChainErrorMessage = (currentChainId?: number): string => {
  const expected = appConfig.chain;
  
  if (!currentChainId) {
    return `Please connect to ${expected.name}`;
  }
  
  const current = SUPPORTED_CHAINS[currentChainId as SupportedChainId];
  return `Wrong network. Please switch from ${current?.name || 'Unknown'} to ${expected.name}`;
};

export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar contratos
  const requiredContracts: Array<keyof ContractAddresses> = [
    'personalFundFactory',
    'usdc',
    'treasury',
    'governance',
    'token',
  ];
  
  requiredContracts.forEach(name => {
    try {
      getContractAddress(name);
    } catch (error) {
      errors.push(`Missing ${name} address`);
    }
  });

  if (!appConfig.apiUrl) {
    errors.push('Missing API URL');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
export default appConfig;

export {
  type Chain,
  type SupportedChainId,
  type ContractAddresses,
  type ChainConfig,
  type AppConfig,
  type Environment,
};