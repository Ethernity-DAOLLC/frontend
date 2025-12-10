import { 
  arbitrum, 
  arbitrumSepolia, 
  polygon,
  polygonAmoy,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  mainnet,
  sepolia 
} from 'wagmi/chains'
import type { Chain } from 'wagmi/chains'

export interface ChainMetadata {
  deployed: boolean
  hasContracts: boolean
  priority: number
  faucets?: string[]
  bridge?: string
  isTestnet: boolean
}

export const CHAIN_METADATA: Record<number, ChainMetadata> = {
  421614: {
    deployed: true,
    hasContracts: true,
    priority: 1,
    isTestnet: true,
    faucets: [
      'https://faucet.quicknode.com/arbitrum/sepolia',
      'https://www.alchemy.com/faucets/arbitrum-sepolia'
    ],
    bridge: 'https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia',
  },

  // Polygon Amoy - READY TO DEPLOY
  80002: {
    deployed: false,
    hasContracts: false,
    priority: 2,
    isTestnet: true,
    faucets: [
      'https://faucets.chain.link/polygon-amoy',
      'https://faucet.polygon.technology/',
      'https://www.alchemy.com/faucets/polygon-amoy'
    ],
    bridge: 'https://portal.polygon.technology/bridge',
  },

  84532: {
    deployed: false,
    hasContracts: false,
    priority: 3,
    isTestnet: true,
    faucets: [
      'https://www.alchemy.com/faucets/base-sepolia',
      'https://docs.base.org/tools/network-faucets'
    ],
  },

  11155420: {
    deployed: false,
    hasContracts: false,
    priority: 4,
    isTestnet: true,
    faucets: [
      'https://app.optimism.io/faucet',
      'https://www.alchemy.com/faucets/optimism-sepolia'
    ],
  },

  11155111: {
    deployed: false,
    hasContracts: false,
    priority: 5,
    isTestnet: true,
    faucets: [
      'https://sepoliafaucet.com',
      'https://faucet.quicknode.com/ethereum/sepolia'
    ],
  },

  42161: {
    deployed: false,
    hasContracts: false,
    priority: 10,
    isTestnet: false,
  },

  137: {
    deployed: false,
    hasContracts: false,
    priority: 11,
    isTestnet: false,
  },

  8453: {
    deployed: false,
    hasContracts: false,
    priority: 12,
    isTestnet: false,
  },

  10: {
    deployed: false,
    hasContracts: false,
    priority: 13,
    isTestnet: false,
  },

  1: {
    deployed: false,
    hasContracts: false,
    priority: 14,
    isTestnet: false,
  },
}

export const SUPPORTED_CHAINS = [
  arbitrumSepolia,
  polygonAmoy,
  baseSepolia,
  optimismSepolia,
  sepolia,

  arbitrum,
  polygon,
  base,
  optimism,
  mainnet,
] as const

export const TESTNET_CHAINS = [
  arbitrumSepolia,
  polygonAmoy,
  baseSepolia,
  optimismSepolia,
  sepolia,
] as const

export const MAINNET_CHAINS = [
  arbitrum,
  polygon,
  base,
  optimism,
  mainnet,
] as const

export const ACTIVE_CHAINS = SUPPORTED_CHAINS.filter(
  chain => CHAIN_METADATA[chain.id]?.deployed
)
export const DEFAULT_CHAIN = arbitrumSepolia
export const ACTIVE_CHAIN_IDS = ACTIVE_CHAINS.map(c => c.id)
export const getChainById = (chainId: number): Chain | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId)
}
export const getChainMetadata = (chainId: number): ChainMetadata | undefined => {
  return CHAIN_METADATA[chainId]
}
export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAINS.some(chain => chain.id === chainId)
}
export const isChainActive = (chainId: number): boolean => {
  return ACTIVE_CHAINS.some(chain => chain.id === chainId)
}
export const isTestnet = (chainId: number): boolean => {
  return CHAIN_METADATA[chainId]?.isTestnet ?? false
}
export const hasContracts = (chainId: number): boolean => {
  return CHAIN_METADATA[chainId]?.hasContracts ?? false
}
export const getFaucets = (chainId: number): string[] => {
  return CHAIN_METADATA[chainId]?.faucets ?? []
}
export const getBridge = (chainId: number): string | undefined => {
  return CHAIN_METADATA[chainId]?.bridge
}
export const getExplorerUrl = (chainId: number, hash?: string): string => {
  const chain = getChainById(chainId)
  const baseUrl = chain?.blockExplorers?.default?.url || ''
  
  if (!hash) return baseUrl
  
  return `${baseUrl}/tx/${hash}`
}

export const getExplorerAddressUrl = (chainId: number, address: string): string => {
  const chain = getChainById(chainId)
  const baseUrl = chain?.blockExplorers?.default?.url || ''
  
  return `${baseUrl}/address/${address}`
}

export const getChainName = (chainId: number): string => {
  return getChainById(chainId)?.name || 'Unknown Chain'
}

export const getChainsByPriority = (): Chain[] => {
  return [...SUPPORTED_CHAINS].sort((a, b) => {
    const priorityA = CHAIN_METADATA[a.id]?.priority ?? 999
    const priorityB = CHAIN_METADATA[b.id]?.priority ?? 999
    return priorityA - priorityB
  })
}

export const getActiveChains = (): Chain[] => {
  return SUPPORTED_CHAINS.filter(chain => 
    CHAIN_METADATA[chain.id]?.deployed
  )
}

export const getChainErrorMessage = (currentChainId?: number): string => {
  if (!currentChainId) {
    return `Please connect to one of: ${ACTIVE_CHAINS.map(c => c.name).join(', ')}`
  }
  
  const current = getChainById(currentChainId)
  const activeNames = ACTIVE_CHAINS.map(c => c.name).join(', ')
  return `Wrong network. Current: ${current?.name || 'Unknown'}. Please switch to: ${activeNames}`
}

export type SupportedChainId = typeof SUPPORTED_CHAINS[number]['id']
export type ActiveChainId = typeof ACTIVE_CHAINS[number]['id']
export type TestnetChainId = typeof TESTNET_CHAINS[number]['id']
export type MainnetChainId = typeof MAINNET_CHAINS[number]['id']