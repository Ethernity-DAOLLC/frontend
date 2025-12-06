import { http, createConfig } from 'wagmi';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';
import { supportedChains } from './contracts';

export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'a49b39e0cf8adcda42be429efd6217f2',
      metadata: {
        name: 'Ethernity DAO',
        description: 'Retirement Fund DApp',
        url: 'https://www.ethernity-dao.com',
        icons: ['https://www.ethernity-dao.com/logo.png'],
      },
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'Ethernity DAO',
      appLogoUrl: 'https://www.ethernity-dao.com/logo.png',
    }),
  ],
  transports: {
    [421614]: http(),
    [300]: http(),
    [42161]: http(),
    [324]: http(),
    [1]: http(),
    [137]: http(),
    [8453]: http(),
    [10]: http(),
  },
  ssr: false,
});