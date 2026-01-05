import { cookieStorage, createStorage, http, fallback } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient } from '@tanstack/react-query'
import { ACTIVE_CHAINS, DEFAULT_CHAIN } from './chains'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY
const INFURA_KEY = import.meta.env.VITE_INFURA_API_KEY

if (!projectId) {
  throw new Error('❌ VITE_WALLETCONNECT_PROJECT_ID not defined in .env')
}
if (!ALCHEMY_KEY) {
  throw new Error('❌ VITE_ALCHEMY_API_KEY not defined in .env')
}

export const chains = ACTIVE_CHAINS

const metadata = {
  name: 'Ethernity DAO',
  description: 'Decentralized retirement fund platform on blockchain',
  url: typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://ethernity-dao.com',
  icons: [
    typeof window !== 'undefined' 
      ? `${window.location.origin}/ethernity.ico`
      : 'https://ethernity-dao.com/ethernity.ico'
  ]
}
const getTransports = () => {
  const transports: Record<number, ReturnType<typeof fallback>> = {}

  transports[421614] = fallback([
    http(`https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://arbitrum-sepolia.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://sepolia-rollup.arbitrum.io/rpc'),
  ])

  transports[80002] = fallback([
    http(`https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://polygon-amoy.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://rpc-amoy.polygon.technology'),
  ])

  transports[84532] = fallback([
    http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://base-sepolia.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://sepolia.base.org'),
  ])

  transports[11155420] = fallback([
    http(`https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://optimism-sepolia.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://sepolia.optimism.io'),
  ])

  transports[11155111] = fallback([
    http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://sepolia.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://rpc.sepolia.org'),
  ])

  transports[42161] = fallback([
    http(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://arb1.arbitrum.io/rpc'),
  ])

  transports[137] = fallback([
    http(`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://polygon-rpc.com'),
  ])

  transports[8453] = fallback([
    http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://base-mainnet.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://mainnet.base.org'),
  ])

  transports[10] = fallback([
    http(`https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://mainnet.optimism.io'),
  ])
  
  transports[1] = fallback([
    http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    ...(INFURA_KEY ? [http(`https://mainnet.infura.io/v3/${INFURA_KEY}`)] : []),
    http('https://eth.llamarpc.com'),
  ])
  
  return transports
}

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains,
  transports: getTransports(), 
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: false,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: chains,
  defaultNetwork: DEFAULT_CHAIN,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: [],
    emailShowWallets: true,
    allWallets: true,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#1B5E20',
    '--w3m-border-radius-master': '8px',
    '--w3m-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  }
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  }
})
export const isActiveChain = (chainId: number): boolean => {
  return chains.some(chain => chain.id === chainId)
}
export const getActiveChain = (chainId: number) => {
  return chains.find(chain => chain.id === chainId)
}
if (import.meta.env.DEV) {
  console.log('🌐 Web3 Config Initialized:')
  console.log('✅ Alchemy Key:', ALCHEMY_KEY ? '✓' : '✗')
  console.log('✅ Infura Key:', INFURA_KEY ? '✓' : '✗')
  console.log('✅ Active Chains:', chains.map(c => c.name).join(', '))
  console.log('✅ Transports configured with fallback for all chains')
}