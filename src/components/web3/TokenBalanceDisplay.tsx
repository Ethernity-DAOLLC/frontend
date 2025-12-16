import React from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';

interface TokenBalanceDisplayProps {
  tokenAddress?: `0x${string}`;
  tokenAbi: any;
  tokenSymbol?: string;
  decimals?: number;
  className?: string;
}

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({
  tokenAddress,
  tokenAbi,
  tokenSymbol = 'Token',
  decimals = 6,
  className = '',
}) => {
  const { balance, isLoading, error, refetch } = useTokenBalance({
    tokenAddress,
    tokenAbi,
    decimals,
    enabled: !!tokenAddress,
  });

  if (!tokenAddress) {
    return null;
  }

  return (
    <div className={`bg-white/90 backdrop-blur border-2 border-purple-200 rounded-2xl px-6 py-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="text-purple-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Your {tokenSymbol} Balance</p>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <span className="text-lg font-semibold text-gray-400">Loading...</span>
              </div>
            ) : error ? (
              <p className="text-lg font-semibold text-red-600">Error loading balance</p>
            ) : (
              <p className="text-3xl font-black text-purple-700">
                {balance} {tokenSymbol}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 hover:bg-purple-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh balance"
        >
          <RefreshCw 
            size={20} 
            className={`text-purple-600 ${isLoading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>
    </div>
  );
};