import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, arbitrumSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { AuthProvider } from './context/AuthContext';
import { RetirementProvider } from './context/RetirementContext';

const zkSyncSepolia = {
  id: 300,
  name: 'zkSync Sepolia Testnet',
  network: 'zksync-sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.era.zksync.dev'],
    },
    public: {
      http: ['https://sepolia.era.zksync.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'zkSync Explorer',
      url: 'https://sepolia.explorer.zksync.io',
    },
  },
  testnet: true,
} as const;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5000,
      structuralSharing: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

queryClient.setDefaultOptions({
  queries: {
    throwOnError: false,
    retry(failureCount, error) {
      if (failureCount > 3) return false;
      return true;
    },
  },
});

const config = createConfig(
  getDefaultConfig({
    appName: 'Ethernity DAO',
    appDescription: 'Decentralized Retirement Funds with DAO Governance',
    appUrl: import.meta.env.DEV
    ? 'http://localhost:3000' 
    : 'https://ethernity-dao.com',
    appIcon: '/logo.png',
    
    chains: [arbitrumSepolia, sepolia, zkSyncSepolia],
    
    transports: {
      [arbitrumSepolia.id]: http(
        import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC || 
        'https://sepolia-rollup.arbitrum.io/rpc'
      ),
      [sepolia.id]: http(
        import.meta.env.VITE_SEPOLIA_RPC || 
        'https://ethereum-sepolia-rpc.publicnode.com'
      ),
      [zkSyncSepolia.id]: http(
        import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC || 
        'https://sepolia.era.zksync.dev'
      ),
    },
    
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  })
);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280', marginTop: '16px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            mode="light"
            theme="rounded"
            options={{
              initialChainId: arbitrumSepolia.id,
              enforceSupportedChains: true,
            }}
            <AuthProvider>
              <RetirementProvider>
                <App />
              </RetirementProvider>
            </AuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);