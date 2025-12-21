import { arbitrum, mainnet, optimism, polygon, base, arbitrumSepolia } from 'viem/chains';

export interface ChainConfig {
  chainId: number;
  name: string;
  isTestnet: boolean;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    usdc: `0x${string}`;
    personalFundFactory?: `0x${string}`;
    treasury?: `0x${string}`;
  };
  faucet?: {
    enabled: boolean;
    apiUrl: string;
  };
}
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [arbitrumSepolia.id]: {
    chainId: arbitrumSepolia.id,
    name: 'Arbitrum Sepolia',
    isTestnet: true,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    contracts: {
      usdc: '0x53E691B568B87f0124bb3A88C8b9958bF8396E81', // MockUSDC
      personalFundFactory: '0x0000000000000000000000000000000000000000', // Actualiza cuando despliegues
      treasury: '0xEe4A90a9d3E24cBB7b1522552717D4F379d405B2',
    },
    faucet: {
      enabled: true,
      apiUrl: 'https://usdc-faucet-production.up.railway.app',
    },
  },

  [mainnet.id]: {
    chainId: mainnet.id,
    name: 'Ethereum',
    isTestnet: false,
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
    explorerUrl: 'https://etherscan.io',
    contracts: {
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC oficial
      // personalFundFactory: '0x...', // Despliega cuando estés listo
      // treasury: '0x...', // Tu treasury en mainnet
    },
    // Sin faucet en mainnet
  },

  [arbitrum.id]: {
    chainId: arbitrum.id,
    name: 'Arbitrum One',
    isTestnet: false,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    contracts: {
      usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC oficial (nativo)
      // O: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' para USDC.e (bridged)
    },
  },

  [optimism.id]: {
    chainId: optimism.id,
    name: 'Optimism',
    isTestnet: false,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    contracts: {
      usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC oficial
    },
  },

  [polygon.id]: {
    chainId: polygon.id,
    name: 'Polygon',
    isTestnet: false,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    contracts: {
      usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC oficial (nativo)
      // O: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' para USDC.e (bridged)
    },
  },

  [base.id]: {
    chainId: base.id,
    name: 'Base',
    isTestnet: false,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    contracts: {
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  },
};
export const DEFAULT_CHAIN_ID = import.meta.env.PROD 
  ? arbitrum.id 
  : arbitrumSepolia.id;  

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}
export function getUSDCAddress(chainId: number): `0x${string}` | undefined {
  return CHAIN_CONFIGS[chainId]?.contracts.usdc;
}
export function hasFaucet(chainId: number): boolean {
  return CHAIN_CONFIGS[chainId]?.faucet?.enabled ?? false;
}
export function getFaucetUrl(chainId: number): string | undefined {
  return CHAIN_CONFIGS[chainId]?.faucet?.apiUrl;
}
export function getSupportedChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS);
}
export function getMainnetChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(config => !config.isTestnet);
}
export function getTestnetChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(config => config.isTestnet);
}
import { useChainId } from 'wagmi';

export function useChainConfig() {
  const chainId = useChainId();
  const config = getChainConfig(chainId);
  
  return {
    config,
    isSupported: !!config,
    isTestnet: config?.isTestnet ?? false,
    hasFaucet: hasFaucet(chainId),
    usdcAddress: getUSDCAddress(chainId),
    faucetUrl: getFaucetUrl(chainId),
  };
}