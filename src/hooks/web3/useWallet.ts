import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { open } from '@reown/appkit/react';

const arbitrumSepolia = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] } },
} as const;

const sepolia = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'] } },
} as const;

const SUPPORTED_CHAINS = [arbitrumSepolia, sepolia] as const;

export function useWallet() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const connect = () => open();
  const openAccount = () => open({ view: 'Account' });
  const openNetworks = () => open({ view: 'Networks' });

  const switchToArbitrum = async () => {
    if (chainId !== arbitrumSepolia.id) {
      await switchChainAsync?.({ chainId: arbitrumSepolia.id });
    }
  };

  const switchToSepolia = async () => {
    if (chainId !== sepolia.id) {
      await switchChainAsync?.({ chainId: sepolia.id });
    }
  };

  const disconnect = async () => {
    await disconnectAsync?.();
  };

  return {
    address,
    isConnected,
    chainId,
    connector,
    currentChain: SUPPORTED_CHAINS.find(c => c.id === chainId),

    connect,
    disconnect,
    openAccount,
    openNetworks,
    switchToArbitrum,
    switchToSepolia,
    isSwitching,

    supportedChains: SUPPORTED_CHAINS,
  };
}