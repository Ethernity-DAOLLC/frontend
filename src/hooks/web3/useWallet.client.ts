'use client';

import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

const ARBITRUM_SEPOLIA_ID = 421614;
const SEPOLIA_ID = 11155111;

export function useWallet() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { open } = useAppKit();
  const connect = () => open();
  const openAccount = () => open({ view: 'Account' });
  const openNetworks = () => open({ view: 'Networks' });

  const switchToArbitrum = async () => {
    if (chainId !== ARBITRUM_SEPOLIA_ID) {
      await switchChainAsync?.({ chainId: ARBITRUM_SEPOLIA_ID });
    }
  };

  const switchToSepolia = async () => {
    if (chainId !== SEPOLIA_ID) {
      await switchChainAsync?.({ chainId: SEPOLIA_ID });
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

    connect,
    disconnect,
    openAccount,
    openNetworks,
    switchToArbitrum,
    switchToSepolia,
    isSwitching,

    isArbitrum: chainId === ARBITRUM_SEPOLIA_ID,
    isSepolia: chainId === SEPOLIA_ID,
  };
}