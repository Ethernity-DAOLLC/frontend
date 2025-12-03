import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { arbitrumSepolia, sepolia, mainnet } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient } from '@tanstack/react-query'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('❌ VITE_WALLETCONNECT_PROJECT_ID no está definido en .env')
}
export const chains = [arbitrumSepolia, sepolia, mainnet] as const

const metadata = {
  name: 'Ethernity DAO',
  description: 'Plataforma descentralizada para gestión de fondos de retiro',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['/ethernity.ico']
}

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains,
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
  defaultNetwork: arbitrumSepolia,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: [], 
    emailShowWallets: true
  },
  themeMode: 'dark', // 'light' | 'dark'
  themeVariables: {
    '--w3m-accent': '#8a7d07',
    '--w3m-border-radius-master': '4px'
  }
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5000,
      refetchOnWindowFocus: false
    }
  }
})