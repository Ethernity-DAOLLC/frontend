export interface ContractAddresses {
  personalFundFactory: `0x${string}`
  usdc: `0x${string}`
  treasury: `0x${string}`
  governance: `0x${string}`
  token: `0x${string}`
  protocolRegistry?: `0x${string}`
  userPreferences?: `0x${string}`
  dateTime?: `0x${string}`
  personalFund?: `0x${string}`
}

const OFFICIAL_USDC: Record<number, `0x${string}`> = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',       // Polygon Amoy
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',       // Base Sepolia
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',    // Optimism Sepolia
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',    // Ethereum Sepolia
  
  // Mainnets
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',       // Arbitrum One
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',        // Polygon
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',       // Base
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',         // Optimism
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',          // Ethereum
}
const MOCK_USDC: Record<number, `0x${string}`> = {
  421614: '0x53E691B568B87f0124bb3A88C8b9958bF8396E81',
}
const getUSDCAddress = (chainId: number): `0x${string}` => {
  if (chainId === 421614) {
    return MOCK_USDC[421614];
  }
  if (MOCK_USDC[chainId]) {
    return MOCK_USDC[chainId];
  }
  return OFFICIAL_USDC[chainId];
}

export const ZERO_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {

  421614: {
    personalFundFactory: '0xf5aa3b54EA1E8740731480f33600259E681a9354',
    usdc: getUSDCAddress(421614),
    treasury: '0xbE9a35049f3C826c779B8EAe40c8a340AE2d8431',
    governance: '0xd6e7Abc15D4957755Bd03AcF7849A84011F33F42',
    token: '0xe9F673837c33c60CEd00E1Cb06779a90B0cdA50C',
    protocolRegistry: '0x2fd48e66A08D9139fb234423b9925FdC5B29D441',
    userPreferences: '0x474eb4F3efA328a72eecf64fA38f7Dbf4e064ed2',
    dateTime: '0x223D278199CB085B7bE690aC406F6aB2A9077599',
    personalFund: '0x4696e3f891E2b5dE503f09b7FF05E8EC16Bd80ab',
  },

  // 🟡 POLYGON AMOY - READY TO DEPLOY
  80002: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(80002),
    treasury: ZERO_ADDRESS, 
    governance: ZERO_ADDRESS, 
    token: ZERO_ADDRESS,     
    protocolRegistry: ZERO_ADDRESS, 
    userPreferences: ZERO_ADDRESS,  
    dateTime: ZERO_ADDRESS,

  },

  // 🔴 BASE SEPOLIA - PENDING
  84532: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(84532),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 OPTIMISM SEPOLIA - PENDING
  11155420: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(11155420),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 ETHEREUM SEPOLIA - PENDING
  11155111: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(11155111),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 ARBITRUM ONE (MAINNET) - PENDING
  42161: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(42161),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 POLYGON (MAINNET) - PENDING
  137: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(137),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 BASE (MAINNET) - PENDING
  8453: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(8453),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 OPTIMISM (MAINNET) - PENDING
  10: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(10),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },

  // 🔴 ETHEREUM (MAINNET) - PENDING
  1: {
    personalFundFactory: ZERO_ADDRESS,
    usdc: getUSDCAddress(1),
    treasury: ZERO_ADDRESS,
    governance: ZERO_ADDRESS,
    token: ZERO_ADDRESS,
  },
}
export const MOCK_USDC_ADDRESS = MOCK_USDC[421614]
export const OFFICIAL_USDC_ADDRESS = OFFICIAL_USDC[421614]
export const getCurrentUSDCType = (chainId: number): 'mock' | 'official' | 'unknown' => {
  const currentAddress = CONTRACT_ADDRESSES[chainId]?.usdc;
  
  if (!currentAddress) return 'unknown';
  if (currentAddress === MOCK_USDC[chainId]) return 'mock';
  if (currentAddress === OFFICIAL_USDC[chainId]) return 'official';
  return 'unknown';
}

export const getOfficialUSDC = (chainId: number): `0x${string}` | undefined => {
  return OFFICIAL_USDC[chainId]
}

export const getMockUSDC = (chainId: number): `0x${string}` | undefined => {
  return MOCK_USDC[chainId]
}

export const hasUSDC = (chainId: number): boolean => {
  return chainId in OFFICIAL_USDC || chainId in MOCK_USDC
}

export const hasMockUSDC = (chainId: number): boolean => {
  return chainId in MOCK_USDC
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

export const isValidAddress = (address: string | undefined): address is `0x${string}` => {
  return !!address && address !== ZERO_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const isContractDeployed = (
  chainId: number,
  contract: keyof ContractAddresses
): boolean => {
  const address = CONTRACT_ADDRESSES[chainId]?.[contract]
  return isValidAddress(address)
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

export const isTestnetChain = (chainId: number): boolean => {
  const testnets = [421614, 80002, 84532, 11155420, 11155111]
  return testnets.includes(chainId)
}

export const getUSDCForChain = (chainId: number): `0x${string}` | undefined => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return undefined
  return addresses.usdc
}

export const getDeployedContracts = (chainId: number): (keyof ContractAddresses)[] => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return []
  
  return Object.entries(addresses)
    .filter(([_, address]) => isValidAddress(address))
    .map(([name]) => name as keyof ContractAddresses)
}

export const getPendingContracts = (chainId: number): (keyof ContractAddresses)[] => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return []
  
  return Object.entries(addresses)
    .filter(([_, address]) => !isValidAddress(address))
    .map(([name]) => name as keyof ContractAddresses)
}

export const getDeploymentProgress = (chainId: number): number => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return 0
  const total = Object.keys(addresses).length
  const deployed = getDeployedContracts(chainId).length
  return Math.round((deployed / total) * 100)
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

export const CONTRACT_CATEGORIES = {
  core: ['personalFundFactory', 'usdc', 'treasury', 'governance', 'token'] as const,
  optional: ['protocolRegistry', 'userPreferences', 'dateTime'] as const,
} as const

export const getCategoryContracts = (
  chainId: number,
  category: keyof typeof CONTRACT_CATEGORIES
): (keyof ContractAddresses)[] => {
  const contracts = CONTRACT_CATEGORIES[category]
  return contracts.filter(contract => 
    isContractDeployed(chainId, contract)
  )
}

export const getContractsByCategory = (chainId: number) => {
  return {
    core: getCategoryContracts(chainId, 'core'),
    optional: getCategoryContracts(chainId, 'optional'),
  }
}

const validateAddressConfig = () => {
  const errors: string[] = []
  
  Object.entries(CONTRACT_ADDRESSES).forEach(([chainIdStr, addresses]) => {
    const chainId = parseInt(chainIdStr)
    if (!addresses.usdc || addresses.usdc === ZERO_ADDRESS) {
      errors.push(`Chain ${chainId}: Missing USDC address`)
    }
  })
  
  if (errors.length > 0) {
    console.warn('⚠️ Address configuration warnings:', errors)
  }
  return errors.length === 0
}

if (import.meta.env.DEV) {
  validateAddressConfig()

  console.log('🎯 USDC Configuration for Arbitrum Sepolia (421614):')
  console.log({
    'MockUSDC (TU contrato)': MOCK_USDC[421614],
    'Official Circle USDC': OFFICIAL_USDC[421614],
    'Currently using': CONTRACT_ADDRESSES[421614].usdc,
    'Type': getCurrentUSDCType(421614),
  })
  
  if (CONTRACT_ADDRESSES[421614].usdc !== MOCK_USDC[421614]) {
    console.error('❌ ERROR: Not using MockUSDC! Check addresses.ts')
  } else {
    console.log('✅ Correctly using MockUSDC')
  }
}