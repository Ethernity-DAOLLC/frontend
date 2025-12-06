import { Chain } from 'viem';
import { arbitrum, arbitrumSepolia, zkSync, mainnet, polygon, base, optimism } from 'viem/chains';

export const zkSyncSepolia = {
  id: 300,
  name: 'zkSync Sepolia Testnet',
  network: 'zksync-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://sepolia.era.zksync.dev'] },
    public: { http: ['https://sepolia.era.zksync.dev'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://sepolia.explorer.zksync.io' },
  },
  testnet: true,
} as const satisfies Chain;

export type ContractName = 
  | 'retirementFund'
  | 'token'
  | 'staking'
  | 'governance'
  | 'treasury'
  | 'rewards'
  | 'vesting'
  | 'factory';

export type ContractAddresses = {
  [K in ContractName]: `0x${string}`;
};

export interface NetworkConfig {
  chain: Chain;
  contracts: ContractAddresses;
}

export const contracts: Record<number, NetworkConfig> = {

  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [zkSyncSepolia.id]: {
    chain: zkSyncSepolia,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [arbitrum.id]: {
    chain: arbitrum,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [zkSync.id]: {
    chain: zkSync,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [mainnet.id]: {
    chain: mainnet,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [polygon.id]: {
    chain: polygon,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [base.id]: {
    chain: base,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },

  [optimism.id]: {
    chain: optimism,
    contracts: {
      retirementFund: '0x0000000000000000000000000000000000000000',
      token: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      governance: '0x0000000000000000000000000000000000000000',
      treasury: '0x0000000000000000000000000000000000000000',
      rewards: '0x0000000000000000000000000000000000000000',
      vesting: '0x0000000000000000000000000000000000000000',
      factory: '0x0000000000000000000000000000000000000000',
    },
  },
};

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return contracts[chainId];
}

export function getContractAddress(
  chainId: number,
  contractName: ContractName
): `0x${string}` | undefined {
  return contracts[chainId]?.contracts[contractName];
}

export function isSupportedNetwork(chainId: number): boolean {
  return chainId in contracts;
}

export function getSupportedChains(): Chain[] {
  return Object.values(contracts).map((config) => config.chain);
}

export function isTestnet(chainId: number): boolean {
  const chain = contracts[chainId]?.chain;
  return chain?.testnet ?? false;
}

export const supportedChains = [
  arbitrumSepolia,
  zkSyncSepolia,
  arbitrum,
  zkSync,
  mainnet,
  polygon,
  base,
  optimism,
] as const;