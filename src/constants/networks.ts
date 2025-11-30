export const SUPPORTED_NETWORKS = {
  ARBITRUM_SEPOLIA: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
  ZKSYNC_SEPOLIA: {
    id: 300,
    name: 'zkSync Sepolia',
    rpcUrl: import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC || 'https://sepolia.era.zksync.dev',
    explorerUrl: 'https://sepolia.explorer.zksync.io',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
} as const;

export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.ARBITRUM_SEPOLIA;
export const getNetworkById = (chainId: number) => {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.id === chainId);
};
