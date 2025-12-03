
import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { arbitrumSepolia, sepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient } from '@tanstack/react-query'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('❌ VITE_WALLETCONNECT_PROJECT_ID no está definido en .env')
}
export const chains = [arbitrumSepolia, sepolia] as const

const metadata = {
  name: 'Ethernity DAO',
  description: 'Plataforma descentralizada para gestión de fondos de retiro',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://ethernity-dao.com', // ✅ Fallback URL
  icons: [
    typeof window !== 'undefined' 
      ? `${window.location.origin}/ethernity.ico`
      : 'https://ethernity-dao.com/ethernity.ico'
  ]
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