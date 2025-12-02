export const TESTNET_RESOURCES = {
  sepolia: {
    faucets: [
      'https://sepoliafaucet.com',
      'https://faucet.quicknode.com/ethereum/sepolia',
    ],
    explorer: 'https://sepolia.etherscan.io',
  },
  arbitrumSepolia: {
    faucets: [
      'https://faucet.quicknode.com/arbitrum/sepolia',
    ],
    bridge: 'https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia',
    explorer: 'https://sepolia.arbiscan.io',
  },
}

export const getChainName = (chainId: number): string => {
  const names: Record<number, string> = {
    11155111: 'Sepolia',
    421614: 'Arbitrum Sepolia',
    1: 'Ethereum',
    42161: 'Arbitrum One',
  }
  return names[chainId] || `Chain ${chainId}`
}