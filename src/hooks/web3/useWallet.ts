import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient, useConnect, useDisconnect } from 'wagmi';
import { WalletClient, PublicClient } from 'viem';

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

export interface WalletState {
  address: `0x${string}` | null;
  isConnected: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
}

interface UseWalletReturn {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  loading: boolean;
  error: string | null;
  signer: WalletClient | null; // ← viem WalletClient (para firmar)
  provider: PublicClient | null; // ← viem PublicClient (para leer)
}

export const useWallet = (): UseWalletReturn => {
  const { address, isConnected, chain } = useAccount();
  const { data: signer } = useWalletClient(); // ← Este es tu "signer" (viem)
  const provider = usePublicClient(); // ← Este es tu "provider" (viem)
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCorrectNetwork = chain?.id === ARBITRUM_SEPOLIA_CHAIN_ID;

  const wallet: WalletState = {
    address: address ?? null,
    isConnected: isConnected ?? false,
    chainId: chain?.id ?? null,
    isCorrectNetwork,
  };

  const connect = useCallback(async () => {
    if (!connectors.length) {
      setError('No connectors available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const injected = connectors.find((c) => c.id === 'injected' || c.name === 'MetaMask');
      if (!injected) throw new Error('MetaMask connector not found');

      await connectAsync({ connector: injected });

      // Si no está en Arbitrum Sepolia, intenta cambiar
      if (chain?.id !== ARBITRUM_SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum?.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${ARBITRUM_SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum?.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${ARBITRUM_SEPOLIA_CHAIN_ID.toString(16)}`,
                  chainName: 'Arbitrum Sepolia',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
                },
              ],
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, [connectAsync, connectors, chain?.id]);

  const disconnectHandler = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Limpia errores al cambiar red o cuenta
  useEffect(() => {
    setError(null);
  }, [address, chain?.id]);

  return {
    wallet,
    connect,
    disconnect: disconnectHandler,
    loading,
    error,
    signer, 
    provider, 
  };
};
