'use client';

import { useAccount, useChainId, usePublicClient, useWalletClient, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

const FAUCET_CONFIG: Record<number, `0x${string}`> = {
  11155111: '0xTU_FAUCET_SEPOLIA',
  421614:   '0xTU_FAUCET_ARBITRUM_SEPOLIA',
  11155420: '0xTU_FAUCET_ZKSYNC_SEPOLIA',
} as const;

const FAUCET_ABI = [
  { name: 'claim', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;

export function BetaFaucet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const faucetAddress = chainId ? FAUCET_CONFIG[chainId] : undefined;
  const isSupportedChain = !!faucetAddress;

  const claim = async () => {
    if (!walletClient || !address || !faucetAddress) return;

    try {
      const { request } = await publicClient!.simulateContract({
        address: faucetAddress,
        abi: FAUCET_ABI,
        functionName: 'claim',
        account: address,
      });

      const txHash = await walletClient.writeContract(request);
      setHash(txHash);
    } catch (err: any) {
      console.error(err);
      alert(err.shortMessage || err.message || 'Error al reclamar tokens');
    }
  };

  if (!isConnected) return null;

  if (!isSupportedChain) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <AlertCircle size={28} />
          <div>
            <p className="font-bold">Cambia de red</p>
            <p className="text-sm opacity-90">Usa Sepolia, Arbitrum Sepolia o zkSync Sepolia</p>
          </div>
        </div>
      </div>
    );
  }

  const explorerUrl = hash
    ? chainId === 11155111
      ? `https://sepolia.etherscan.io/tx/${hash}`
      : chainId === 421614
      ? `https://sepolia.arbiscan.io/tx/${hash}`
      : `https://sepolia.explorer.zksync.io/tx/${hash}`
    : '';

  return (
    <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-8 text-white shadow-2xl border border-red-400/30">
      <div className="flex items-center gap-4 mb-6">
        <Wallet className="w-12 h-12 animate-pulse" />
        <div>
          <h3 className="text-3xl font-black">Beta Faucet</h3>
          <p className="text-lg opacity-90">Tokens de prueba GRATIS</p>
        </div>
      </div>

      <p className="mb-6 text-lg">
        Red actual: <strong className="font-bold">
          {chainId === 11155111 ? 'Sepolia' : chainId === 421614 ? 'Arbitrum Sepolia' : 'zkSync Sepolia'}
        </strong>
      </p>

      <p className="mb-8 text-2xl opacity-90">
        Recibirás: <strong className="font-black">0.5 ETH + 1000 USDC + 1000 USDT</strong>
      </p>

      {isSuccess ? (
        <div className="bg-white/20 backdrop-blur rounded-2xl p-6 border border-white/30">
          <div className="flex items-center gap-3 text-green-300">
            <CheckCircle size={32} />
            <span className="text-2xl font-bold">¡Tokens enviados!</span>
          </div>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-4 text-sm underline hover:text-white"
            >
              Ver transacción en el explorador
            </a>
          )}
        </div>
      ) : (
        <button
          onClick={claim}
          disabled={isConfirming}
          className="w-full py-6 bg-white text-red-600 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-500 rounded-2xl font-black text-2xl transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center gap-4"
        >
          {isConfirming ? (
            <>
              <Loader2 className="animate-spin" size={32} />
              Enviando tokens...
            </>
          ) : (
            'Claim Tokens de Prueba'
          )}
        </button>
      )}

      <p className="text-center text-sm opacity-70 mt-6">
        Solo 1 claim cada 23 horas • Solo en Beta
      </p>
    </div>
  );
}