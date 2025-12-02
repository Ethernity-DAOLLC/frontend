import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { open } from '@reown/appkit/react';
import { arbitrumSepolia, sepolia } from '@reown/appkit/networks';

const SUPPORTED_CHAINS = [arbitrumSepolia, sepolia] as const;

export function useWallet() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const openModal = () => open();
  const openNetworks = () => open({ view: 'Networks' });
  const openAccount = () => open({ view: 'Account' });

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

    connect: openModal,
    disconnect,
    openModal,
    openAccount,
    openNetworks,
    switchToArbitrum,
    switchToSepolia,
    isSwitching,

    currentChain: SUPPORTED_CHAINS.find(c => c.id === chainId),
    supportedChains: SUPPORTED_CHAINS,
  };
}