import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import './i18n/config'
import { wagmiConfig, queryClient } from './config/web3'
import { RetirementProvider } from './context/RetirementContext'

if (import.meta.env.DEV) {
  console.log('🚀 Ethernity DAO Frontend Starting...');
  console.log('📍 Mode:', import.meta.env.MODE);
  console.log('🔗 API URL:', import.meta.env.VITE_API_URL);
  console.log('⛓️ WalletConnect Project ID:', 
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ? '✅ Set' : '❌ Missing'
  );
}

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