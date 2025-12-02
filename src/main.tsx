import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { arbitrumSepolia, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

import { AuthProvider } from './context/AuthContext';
import { RetirementProvider } from './context/RetirementContext';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID');

const metadata = {
  name: 'Ethernity DAO',
  description: 'Decentralized Retirement Funds with DAO Governance',
  url: 'https://ethernity-dao.com',
  icons: ['https://ethernity-dao.com/logo.png']
};

const config = createConfig({
  chains: [arbitrumSepolia, sepolia],
  transports: {
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
  },
});

const wagmiAdapter = new WagmiAdapter({
  config,
  projectId,
  metadata,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [arbitrumSepolia, sepolia],
  projectId,
  metadata,
  themeMode: 'light', 
  themeVariables: {
    '--w3m-accent': '#7c3aed', 
    '--w3m-radius': '12px',  
  },
  defaultNetwork: arbitrumSepolia,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RetirementProvider>
            <App />
          </RetirementProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);