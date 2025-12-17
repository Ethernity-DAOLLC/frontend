export * from './chains'
export * from './web3'
export * from './addresses'
export * from './app'
export * from './contracts.config'
export * from './faucet.config'

export { CHAIN_IDS, TESTNET_CHAIN_IDS, MAINNET_CHAIN_IDS } from './chains'
export { CONTRACT_ADDRESSES, ZERO_ADDRESS } from './addresses'
export { FAUCET_CONFIG, TEST_TOKEN_ABI, FAUCET_ABI } from './faucet.config'
export { MOCK_USDC_ABI, USDC_DECIMALS } from './contracts.config'

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