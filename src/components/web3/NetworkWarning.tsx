import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN, getChainName } from '@/config/chains';

interface NetworkWarningProps {
  expectedChainId?: number;
}

export function NetworkWarning({ 
  expectedChainId = DEFAULT_CHAIN.id 
}: NetworkWarningProps) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const isWrongNetwork = isConnected && chainId !== expectedChainId;

  if (!isWrongNetwork) return null;

  const currentChainName = getChainName(chainId);
  const expectedChainName = getChainName(expectedChainId);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
          <div>
            <p className="font-bold text-lg">Wrong Network Detected</p>
            <p className="text-sm opacity-90">
              You're on <strong>{currentChainName}</strong>. 
              Please switch to <strong>{expectedChainName}</strong>
            </p>
          </div>
        </div>
        
        <button
          onClick={() => switchChain({ chainId: expectedChainId })}
          disabled={isPending}
          className="bg-white text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
        >
          {isPending ? 'Switching...' : 'Switch Network'}
        </button>
      </div>
    </div>
  );
}
