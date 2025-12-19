export * from './chains'
export * from './web3'
export * from './addresses'
export * from './app'
export * from './contracts.config'

export { CHAIN_IDS, TESTNET_CHAIN_IDS, MAINNET_CHAIN_IDS } from './chains'
export { CONTRACT_ADDRESSES, ZERO_ADDRESS } from './addresses'
export { MOCK_USDC_ABI, USDC_DECIMALS } from './contracts.config'

export { 
  WALLETCONNECT_PROJECT_ID, 
  API_URL,
  validateEnv,
  getEnv
} from '@/lib/validateEnv'

export type { 
  ChainMetadata, 
  SupportedChainId, 
  ActiveChainId,
  TestnetChainId,
  MainnetChainId 
} from './chains'

export type { 
  ContractAddresses, 
  ContractName, 
  ChainId 
} from './addresses'

export type {
  MintPreset
} from './contracts.config'