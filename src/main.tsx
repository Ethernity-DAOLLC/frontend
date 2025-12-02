import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { arbitrumSepolia, sepolia } from '@reown/appkit/networks'
import { AuthProvider } from '@/context/AuthContext'
import { RetirementProvider } from '@/context/RetirementContext'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is required')
}

const wagmiAdapter = new WagmiAdapter({
  networks: [arbitrumSepolia, sepolia],
  projectId,
  ssr: false,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: [arbitrumSepolia, sepolia],
  defaultNetwork: arbitrumSepolia,
  projectId,
  metadata: {
    name: 'Ethernity DAO',
    description: 'Decentralized Retirement Funds with DAO Governance',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://ethernity-dao.com',
    icons: [
      typeof window !== 'undefined' 
        ? `${window.location.origin}/logo.png`
        : 'https://ethernity-dao.com/logo.png'
    ],
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    allWallets: true,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#1B5E20',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RetirementProvider>
            <App />
          </RetirementProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)