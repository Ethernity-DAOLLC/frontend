export interface ContractAddresses {
  personalFundFactory: `0x${string}`
  usdc: `0x${string}`
  treasury: `0x${string}`
  governance: `0x${string}`
  token: `0x${string}`
  protocolRegistry?: `0x${string}`
  userPreferences?: `0x${string}`
  dateTime?: `0x${string}`
  mockUsdc?: `0x${string}`
}

const OFFICIAL_USDC: Record<number, `0x${string}`> = {
  // TESTNETS
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  
  // MAINNETS
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 
}

const ZERO_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  421614: {
    personalFundFactory: '0xCC29838D66b4aFFB1A4127Cd7DBc60648BcC93d6',
    usdc: OFFICIAL_USDC[421614],
    treasury: '0x2F1948D9FA3BB1942f51ebBdA265B1185c3c52dC',
    governance: '0x6206f8B2729EF9c7dBC651DeE4dF08A44A720A3E',
    token: '0x3D7cfDB2a190B0F8bDf753Af19f3f3D13eca0020',
    protocolRegistry: '0xBc6004CA4A0c6CdD1046CBB2598F7C0B20CA6bd8',
    userPreferences: '0x860AB33F149A3dD89cDa6DE77Fd6d40f2AA7a633',
    dateTime: '0x493b4ba152970a04981EC9ccB4794F747b64Af57',
    mockUsdc: '0x7C27E3d618621Dec3340921AAC5FD7e24aaf3413',
  },

  // 🟡 POLYGON AMOY - READY TO DEPLOY
  80002: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[80002],
    treasury: ZERO_ADDRESS, 
    governance: ZERO_ADDRESS, 
    token: ZERO_ADDRESS,     
    protocolRegistry: ZERO_ADDRESS, 
    userPreferences: ZERO_ADDRESS,  
    dateTime: ZERO_ADDRESS,
    mockUsdc: ZERO_ADDRESS, 
  },

  84532: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[84532],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
    mockUsdc: ZERO_ADDRESS,
  },

  11155420: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[11155420],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
    mockUsdc: ZERO_ADDRESS,
  },

  11155111: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: OFFICIAL_USDC[11155111],
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
    mockUsdc: ZERO_ADDRESS,
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

export const getMockUSDC = (chainId: number): `0x${string}` | undefined => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  return addresses?.mockUsdc
}

export const hasMockUSDC = (chainId: number): boolean => {
  const mockUsdc = getMockUSDC(chainId)
  return isValidAddress(mockUsdc)
}

export const isTestnetChain = (chainId: number): boolean => {
  const testnets = [421614, 80002, 84532, 11155420, 11155111]
  return testnets.includes(chainId)
}

export const getUSDCForChain = (
  chainId: number,
  preferMock: boolean = true
): `0x${string}` | undefined => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return undefined

  if (isTestnetChain(chainId) && preferMock) {
    const mockUsdc = getMockUSDC(chainId)
    if (isValidAddress(mockUsdc)) {
      return mockUsdc
    }
  }
  return addresses.usdc
}

export const getUSDCMetadata = (chainId: number, address: `0x${string}`) => {
  const mockUsdc = getMockUSDC(chainId)
  const officialUsdc = getOfficialUSDC(chainId)
  
  if (address === mockUsdc) {
    return {
      type: 'mock' as const,
      name: 'Mock USDC Test',
      symbol: 'mUSDC',
      decimals: 6,
      canMint: true,
    }
  }
  
  if (address === officialUsdc) {
    return {
      type: 'official' as const,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      canMint: false,
    }
  }
  
  return null
}

export const getDeploymentSummary = () => {
  const summary: Record<number, {
    chainId: number
    name: string
    deployed: number
    pending: number
    progress: number
    isComplete: boolean
  }> = {}
  
  const chainNames: Record<number, string> = {
    421614: 'Arbitrum Sepolia',
    80002: 'Polygon Amoy',
    84532: 'Base Sepolia',
    11155420: 'Optimism Sepolia',
    11155111: 'Ethereum Sepolia',
    42161: 'Arbitrum One',
    137: 'Polygon',
    8453: 'Base',
    10: 'Optimism',
    1: 'Ethereum',
  }
  
  Object.keys(CONTRACT_ADDRESSES).forEach(chainIdStr => {
    const chainId = parseInt(chainIdStr)
    const deployed = getDeployedContracts(chainId)
    const pending = getPendingContracts(chainId)
    const progress = getDeploymentProgress(chainId)
    
    summary[chainId] = {
      chainId,
      name: chainNames[chainId] || 'Unknown',
      deployed: deployed.length,
      pending: pending.length,
      progress,
      isComplete: areMainContractsDeployed(chainId),
    }
  })
  
  return summary
}

export const updateChainAddresses = (
  chainId: number,
  addresses: Partial<ContractAddresses>
): void => {
  if (import.meta.env.PROD) {
    console.error('❌ Cannot update addresses in production')
    return
  }
  
  const current = CONTRACT_ADDRESSES[chainId]
  if (!current) {
    console.error(`❌ Chain ${chainId} not configured`)
    return
  }
  
  Object.assign(current, addresses)
  console.log(`✅ Updated addresses for chain ${chainId}:`, addresses)
}

export type ContractName = keyof ContractAddresses
export type ChainId = keyof typeof CONTRACT_ADDRESSES

export const DEPLOYMENT_STATUS = {
  421614: {
    status: 'deployed' as const,
    date: '2024-12-14',
    deployer: '0x2c81Af5Ca0663Ef8aa73b498c0E5BeC54EB24C15',
    verified: true,
  },
  80002: {
    status: 'pending' as const,
    date: null,
    deployer: null,
    verified: false,
  },
  84532: {
    status: 'pending' as const,
    date: null,
    deployer: null,
    verified: false,
  },
  11155420: {
    status: 'pending' as const,
    date: null,
    deployer: null,
    verified: false,
  },
  11155111: {
    status: 'pending' as const,
    date: null,
    deployer: null,
    verified: false,
  },
} as const

export const getDeploymentStatus = (chainId: number) => {
  return DEPLOYMENT_STATUS[chainId as keyof typeof DEPLOYMENT_STATUS] || {
    status: 'unknown' as const,
    date: null,
    deployer: null,
    verified: false,
  }
}