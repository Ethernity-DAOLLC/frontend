import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { wagmiConfig, queryClient } from './config/web3'
import { RetirementProvider } from './context/RetirementContext'

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