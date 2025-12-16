import React from 'react';
import { Wallet, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useUSDCBalance } from '@/hooks/usdc/useUSDCBalance';
import { formatCurrency } from '@/lib';

interface USDCBalanceDisplayProps {
  requiredAmount?: bigint;
  showValidation?: boolean;
  className?: string;
}

export const USDCBalanceDisplay: React.FC<USDCBalanceDisplayProps> = ({
  requiredAmount,
  showValidation = false,
  className = '',
}) => {
  const {
    balanceFormatted,
    balanceRaw,
    hasEnoughBalance,
    isLoading,
    error,
    refetch,
  } = useUSDCBalance();

  const hasEnough = requiredAmount ? hasEnoughBalance(requiredAmount) : true;
  const requiredFormatted = requiredAmount
    ? formatCurrency(parseFloat((Number(requiredAmount) / 1e6).toFixed(2)))
    : null;

  return (
    <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 border-2 ${
      showValidation
        ? hasEnough
          ? 'border-green-200'
          : 'border-red-200'
        : 'border-purple-200'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            showValidation
              ? hasEnough
                ? 'bg-green-100'
                : 'bg-red-100'
              : 'bg-purple-100'
          }`}>
            <Wallet className={
              showValidation
                ? hasEnough
                  ? 'text-green-600'
                  : 'text-red-600'
                : 'text-purple-600'
            } size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">USDC Balance</p>
            <p className="text-xs text-gray-500">Testnet</p>
          </div>
        </div>
        
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh balance"
        >
          <RefreshCw 
            size={20} 
            className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-lg font-semibold text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-lg font-semibold text-red-600">Error loading</span>
          </div>
        ) : (
          <div>
            <p className="text-4xl font-black text-gray-800">
              {formatCurrency(parseFloat(balanceFormatted))}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {balanceFormatted} USDC
            </p>
          </div>
        )}
      </div>

      {/* Validation Section */}
      {showValidation && requiredAmount && (
        <div className={`rounded-xl p-4 ${
          hasEnough
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {hasEnough ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <p className={`font-semibold mb-1 ${
                hasEnough ? 'text-green-900' : 'text-red-900'
              }`}>
                {hasEnough ? 'Balance Sufficient' : 'Insufficient Balance'}
              </p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className={hasEnough ? 'text-green-700' : 'text-red-700'}>
                    Required:
                  </span>
                  <span className="font-semibold">
                    {requiredFormatted}
                  </span>
                </div>
                {!hasEnough && (
                  <div className="flex justify-between">
                    <span className="text-red-700">
                      Need:
                    </span>
                    <span className="font-semibold text-red-800">
                      {formatCurrency(
                        parseFloat((Number(requiredAmount - balanceRaw) / 1e6).toFixed(2))
                      )} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};