import { useAppKit, type Chain } from '@reown/appkit/react';
import { useAccount, useSwitchChain, useDisconnect } from 'wagmi';
import { arbitrumSepolia, sepolia } from '@reown/appkit/networks';

export function useAppKitCustom() {
  const {
    open,
    isOpen,
    close, 
    supportedWallets,
    wallet, 
    chains, 
    currentChain,
    ...appKitState 
  } = useAppKit();

  const { address, isConnected, chain } = useAccount(); 
  const { switchChain, isPending: isSwitching } = useSwitchChain(); 
  const { disconnect } = useDisconnect(); 

  const connect = () => {
    if (!isConnected) {
      open();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    close();
  };

  const switchToNetwork = async (targetChain: Chain) => {
    if (chain?.id !== targetChain.id) {
      try {
        await switchChain({ chainId: targetChain.id });
      } catch (error) {
        console.error('Error switching chain:', error);
        open({ view: 'Networks' });
      }
    }
  };

  const switchToArbitrum = () => switchToNetwork(arbitrumSepolia);
  const switchToSepolia = () => switchToNetwork(sepolia);

  return {

    isConnected,
    address,
    currentChain: chain || currentChain,
    isOpen,
    isSwitching,
    wallet,

    connect,
    disconnect: handleDisconnect,
    open,
    close,
    switchToNetwork,
    switchToArbitrum,
    switchToSepolia,
    switchChain, 

    chains: chains || [arbitrumSepolia, sepolia],
    supportedWallets,
    ...appKitState,
  };
}
