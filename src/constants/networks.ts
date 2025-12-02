import { Network } from '@reown/appkit-common';

export const NETWORK = {
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    shortName: 'sep',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'],
      },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
    faucets: [
      'https://sepoliafaucet.com',
      'https://faucet.quicknode.com/ethereum/sepolia',
    ],
  },

  ARBITRUM_SEPOLIA: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    shortName: 'arbsep',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'],
      },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
    },
    testnet: true,
    faucets: ['https://faucet.quicknode.com/arbitrum/sepolia'],
    bridge: 'https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia',
  },

  ZKSYNC_SEPOLIA: {
    id: 300,
    name: 'zkSync Sepolia',
    shortName: 'zksyncsep',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC || 'https://sepolia.era.zksync.dev'],
      },
    },
    blockExplorers: {
      default: { name: 'zkExplorer', url: 'https://sepolia.explorer.zksync.io' },
    },
    testnet: true,
    faucets: [] as string[],
  },
} as const;

export const REOWN_NETWORK = Object.values(NETWORK);

export const DEFAULT_NETWORK = NETWORK.ARBITRUM_SEPOLIA;

export const getNetworkById = (networkId: number) =>
  Object.values(NETWORK).find((network) => network.id === chainId);

export const isTestnet = (networkId: number) =>
  getNetworkById(networkId)?.testnet ?? false;

export const getFaucets = (networkId: number): string[] =>
  getNetworkById(networkId)?.faucets ?? [];

export const getExplorerUrl = (networkId: number): string | undefined =>
  getNetworkById(networkId)?.blockExplorers.default.url;