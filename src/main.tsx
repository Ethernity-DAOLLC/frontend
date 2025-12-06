import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import App from './App'
import './index.css'
import { wagmiConfig, queryClient } from './config/web3'
import { supportedChains } from './config/contracts'
import { RetirementProvider } from './context/RetirementContext'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a49b39e0cf8adcda42be429efd6217f2'

const wagmiAdapter = new WagmiAdapter({
  networks: supportedChains,
  projectId,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: supportedChains,
  projectId,
  metadata: {
    name: 'Ethernity DAO',
    description: 'Retirement Fund DApp',
    url: 'https://www.ethernity-dao.com',
    icons: ['https://www.ethernity-dao.com/logo.png'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981',
    '--w3m-border-radius-master': '8px',
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RetirementProvider>
          <App />
        </RetirementProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)