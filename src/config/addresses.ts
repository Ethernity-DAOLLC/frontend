export interface ContractAddresses {
  personalFundFactory: `0x${string}`
  usdc: `0x${string}`
  treasury: `0x${string}`
  governance: `0x${string}`
  token: `0x${string}`
  protocolRegistry?: `0x${string}`
  userPreferences?: `0x${string}`
  dateTime?: `0x${string}`
}
const OFFICIAL_USDC: Record<number, `0x${string}`> = {

  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',

  80001: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',

  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',

  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',

  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',

  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',

  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',

  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
}

const ZERO_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  421614: {
    personalFundFactory: '0x45DdC7b0B7b9D6A0e6039f2f5Ad32c89D1C33808',
    usdc: OFFICIAL_USDC[421614],
    treasury: '0x872000afEC5dAa2fe6Df07F7e72F42C39F9Bd60e',
    governance: '0xC843f5743643fb9322d75030aFFD58C7C9b899D6',
    token: '0xd9a61CE672841EBaCbdCB4e56F7bF0E17B48E29D',
    protocolRegistry: '0x06241a4A5B81f99f63beFC08AEF85e6586B27781',
    userPreferences: '0xACaF297e8187E538A8cB6B7a3b3376828fA2423f',
    dateTime: '0x885F4a9DCaac74CaEf0dc72249Dc3D7a1bf3479F',
  },

  80001: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[80001],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  84532: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[84532],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  11155420: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[11155420],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  11155111: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[11155111],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  42161: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[42161],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS, 
  },

  137: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[137],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  8453: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[8453],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  10: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[10],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  1: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[1],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },
}
export const getContractAddresses = (chainId: number): ContractAddresses | undefined => {
  return CONTRACT_ADDRESSES[chainId]
}
export const getContractAddress = (
  chainId: number,
  contract: keyof ContractAddresses
): `0x${string}` | undefined => {
  return CONTRACT_ADDRESSES[chainId]?.[contract]
}
export const hasChainConfig = (chainId: number): boolean => {
  return chainId in CONTRACT_ADDRESSES
}
export const isContractDeployed = (
  chainId: number,
  contract: keyof ContractAddresses
): boolean => {
  const address = CONTRACT_ADDRESSES[chainId]?.[contract]
  return !!address && address !== ZERO_ADDRESS
}
export const areMainContractsDeployed = (chainId: number): boolean => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return false
  
  const mainContracts: (keyof ContractAddresses)[] = [
    'personalFundFactory',
    'usdc',
    'treasury',
    'governance',
    'token',
  ]
  
  return mainContracts.every(contract => 
    isContractDeployed(chainId, contract)
  )
}
export const getDeployedContracts = (chainId: number): (keyof ContractAddresses)[] => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return []
  
  return Object.entries(addresses)
    .filter(([_, address]) => address && address !== ZERO_ADDRESS)
    .map(([name]) => name as keyof ContractAddresses)
}
export const getPendingContracts = (chainId: number): (keyof ContractAddresses)[] => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return []
  
  return Object.entries(addresses)
    .filter(([_, address]) => !address || address === ZERO_ADDRESS)
    .map(([name]) => name as keyof ContractAddresses)
}
export const getDeploymentProgress = (chainId: number): number => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return 0
  
  const total = Object.keys(addresses).length
  const deployed = getDeployedContracts(chainId).length
  
  return Math.round((deployed / total) * 100)
}
export const isValidAddress = (address: string | undefined): address is `0x${string}` => {
  return !!address && address !== ZERO_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(address)
}
export const getOfficialUSDC = (chainId: number): `0x${string}` | undefined => {
  return OFFICIAL_USDC[chainId]
}
export const hasUSDC = (chainId: number): boolean => {
  return chainId in OFFICIAL_USDC
}
export const getDeploymentSummary = () => {
  const summary: Record<number, {
    chainId: number
    deployed: number
    pending: number
    progress: number
    isComplete: boolean
  }> = {}
  
  Object.keys(CONTRACT_ADDRESSES).forEach(chainIdStr => {
    const chainId = parseInt(chainIdStr)
    const deployed = getDeployedContracts(chainId)
    const pending = getPendingContracts(chainId)
    const progress = getDeploymentProgress(chainId)
    
    summary[chainId] = {
      chainId,
      deployed: deployed.length,
      pending: pending.length,
      progress,
      isComplete: areMainContractsDeployed(chainId),
    }
  })
  
  return summary
}

export type ContractName = keyof ContractAddresses
export type ChainId = keyof typeof CONTRACT_ADDRESSES