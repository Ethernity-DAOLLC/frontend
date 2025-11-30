import { createConfig, http } from 'wagmi';
import { 
  mainnet, 
  sepolia, 
  arbitrum, 
  arbitrumSepolia,
  zkSync,
  zkSyncSepoliaTestnet,
  foundry 
} from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const anvilChain = {
  ...foundry,
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
};

export const TESTNET_RESOURCES = {
  sepolia: {
    faucets: [
      'https://sepoliafaucet.com',
      'https://faucet.quicknode.com/ethereum/sepolia',
      'https://www.alchemy.com/faucets/ethereum-sepolia',
    ],
    explorer: 'https://sepolia.etherscan.io',
  },
  arbitrumSepolia: {
    faucets: [
      'https://faucet.quicknode.com/arbitrum/sepolia',
      'https://www.alchemy.com/faucets/arbitrum-sepolia',
    ],
    bridge: 'https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia',
    explorer: 'https://sepolia.arbiscan.io',
  },
  zkSyncSepolia: {
    faucets: [
      'https://portal.zksync.io/faucet',
      'https://learnweb3.io/faucets/zksync_sepolia',
    ],
    bridge: 'https://portal.zksync.io/bridge/?network=sepolia',
    explorer: 'https://sepolia.explorer.zksync.io',
  },
};

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!WALLETCONNECT_PROJECT_ID) {
  console.warn(
    '⚠️  VITE_WALLETCONNECT_PROJECT_ID no está configurado. ' +
    'WalletConnect no funcionará. Obtén uno en: https://cloud.walletconnect.com'
  );
}

export const config = createConfig({

  chains: [

    anvilChain,

    sepolia,
    arbitrumSepolia,
    zkSyncSepoliaTestnet,

    // ⚠️  WARNING: COSTOS DE GAS REALES
    // mainnet,           // Ethereum Mainnet - CARO ($10-50 por tx)
    // arbitrum,          // Arbitrum One - BARATO ($0.1-1 por tx)
    // zkSync,            // zkSync Era - BARATO + RÁPIDO
  ],

  connectors: [
    injected({
      shimDisconnect: true,
    }),

    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE',
      metadata: {
        name: 'Ethernity DAO',
        description: 'Secure your financial future with blockchain-powered retirement savings',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://ethernity.dao',
        icons: [
          typeof window !== 'undefined' 
            ? `${window.location.origin}/logo.png`
            : 'https://ethernity.dao/logo.png'
        ],
      },
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '9999',
        },
      },
    }),

    // coinbaseWallet({
    //   appName: 'Ethernity DAO',
    // }),
    // safe(), // Gnosis Safe
  ],

  transports: {
    [anvilChain.id]: http('http://127.0.0.1:8545'),

    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [zkSyncSepoliaTestnet.id]: http(),
    
    // MAINNETS (Alchemy, QuickNode)
    // [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`),
    // [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`),
    // [zkSync.id]: http(),
  },

  ssr: false,
  batch: {
    multicall: true, // Batch múltiples llamadas en una sola
  },
});

export const getChainType = (chainId: number): 'local' | 'testnet' | 'mainnet' | 'unknown' => {
  if (chainId === 31337) return 'local';
  if ([11155111, 421614, 300].includes(chainId)) return 'testnet';
  if ([1, 42161, 324].includes(chainId)) return 'mainnet';
  return 'unknown';
};

export const isProductionChain = (chainId: number): boolean => {
  return [1, 42161, 324].includes(chainId);
};

export const getChainName = (chainId: number): string => {
  const names: Record<number, string> = {
    // Local
    31337: 'Anvil Local',
    // Testnets
    11155111: 'Sepolia',
    421614: 'Arbitrum Sepolia',
    300: 'zkSync Sepolia',
    // Mainnets
    1: 'Ethereum',
    42161: 'Arbitrum One',
    324: 'zkSync Era',
  };
  return names[chainId] || `Chain ${chainId}`;
};

export const getTestnetResources = (chainId: number) => {
  switch (chainId) {
    case 11155111: return TESTNET_RESOURCES.sepolia;
    case 421614: return TESTNET_RESOURCES.arbitrumSepolia;
    case 300: return TESTNET_RESOURCES.zkSyncSepolia;
    default: return null;
  }
};

export const needsBridge = (chainId: number): boolean => {
  return [421614, 300].includes(chainId);
};

export const getL1Source = (l2ChainId: number): number | null => {
  const mapping: Record<number, number> = {
    421614: 11155111,  
    300: 11155111, 
    42161: 1, 
    324: 1, 
  };
  return mapping[l2ChainId] || null;
};

export const isWalletConnectConfigured = (): boolean => {
  return !!WALLETCONNECT_PROJECT_ID && WALLETCONNECT_PROJECT_ID !== 'YOUR_PROJECT_ID_HERE';
};

export const getConnectorInfo = (connectorId: string) => {
  const info: Record<string, { name: string; description: string; icon: string }> = {
    injected: {
      name: 'Browser Wallet',
      description: 'MetaMask, Coinbase Wallet, Brave Wallet, etc.',
      icon: '🦊',
    },
    walletConnect: {
      name: 'WalletConnect',
      description: '300+ mobile wallets',
      icon: '📱',
    },
    coinbaseWallet: {
      name: 'Coinbase Wallet',
      description: 'Official Coinbase wallet',
      icon: '🔷',
    },
    safe: {
      name: 'Gnosis Safe',
      description: 'Multi-signature wallet',
      icon: '🔐',
    },
  };
  
  return info[connectorId] || {
    name: connectorId,
    description: 'Unknown connector',
    icon: '❓',
  };
};

export default config;