import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { Droplets, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useFaucet } from '@/hooks/web3/useFaucet';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
const FAUCET_CONTRACT = import.meta.env.VITE_FAUCET_CONTRACT_ADDRESS;
const FAUCET_API_URL = import.meta.env.VITE_FAUCET_API_URL;

interface FaucetButtonProps {
  currentAge: number;
  retirementAge: number;
  desiredMonthlyPayment: number;
  monthlyDeposit: number;
  initialAmount: number;
}

export const FaucetButton: React.FC<FaucetButtonProps> = ({
  currentAge,
  retirementAge,
  desiredMonthlyPayment,
  monthlyDeposit,
  initialAmount,
}) => {
  const { address, isConnected } = useAccount();
  const { requestTokens, loading, error, clearError } = useFaucet(FAUCET_API_URL);
  const [success, setSuccess] = useState(false);
  const [txHashes, setTxHashes] = useState<{ usdc?: string; eth?: string }>({});
  const handleRequestTokens = async () => {
    if (!isConnected || !address) {
      alert('Por favor conecta tu wallet primero');
      return;
    }
    clearError();
    setSuccess(false);
    setTxHashes({});

    try {
      const response = await requestTokens({
        wallet_address: address,
        current_age: currentAge,
        retirement_age: retirementAge,
        desired_monthly_payment: desiredMonthlyPayment,
        monthly_deposit: monthlyDeposit,
        initial_amount: initialAmount,
      });

      if (response.success) {
        setSuccess(true);
        setTxHashes({
          usdc: response.usdc_transaction_hash || undefined,
          eth: response.eth_transaction_hash || undefined,
        });
        setTimeout(() => {
          setSuccess(false);
          setTxHashes({});
        }, 5000);
      }
    } catch (err) {
      console.error('Error requesting tokens:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <Droplets className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Token Addresses</h4>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-blue-700">USDC Token:</span>
                <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {USDC_ADDRESS?.slice(0, 6)}...{USDC_ADDRESS?.slice(-4)}
                </code>
                <a
                  href={`https://sepolia.arbiscan.io/address/${USDC_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={12} className="inline" />
                </a>
              </div>
              <div>
                <span className="text-blue-700">Faucet Contract:</span>
                <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {FAUCET_CONTRACT?.slice(0, 6)}...{FAUCET_CONTRACT?.slice(-4)}
                </code>
                <a
                  href={`https://sepolia.arbiscan.io/address/${FAUCET_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={12} className="inline" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={handleRequestTokens}
        disabled={loading || !isConnected}
        className={`
          w-full font-bold py-4 px-6 rounded-xl transition-all transform 
          flex items-center justify-center gap-3 shadow-lg
          ${loading || !isConnected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white hover:scale-105'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Requesting Tokens...
          </>
        ) : !isConnected ? (
          <>
            <AlertCircle size={24} />
            Connect Wallet First
          </>
        ) : (
          <>
            <Droplets size={24} />
            Request Test Tokens (USDC + ETH)
          </>
        )}
      </button>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h4 className="font-bold text-green-800 mb-2">
                ✅ Tokens Sent Successfully!
              </h4>
              <div className="space-y-2 text-sm">
                {txHashes.usdc && (
                  <div>
                    <span className="text-green-700 font-semibold">USDC Transaction:</span>
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${txHashes.usdc}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-green-600 hover:text-green-800 underline inline-flex items-center gap-1"
                    >
                      View on Arbiscan
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {txHashes.eth && (
                  <div>
                    <span className="text-green-700 font-semibold">ETH Transaction:</span>
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${txHashes.eth}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-green-600 hover:text-green-800 underline inline-flex items-center gap-1"
                    >
                      View on Arbiscan
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 mb-1">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
              {error.includes('rate limit') && (
                <p className="text-red-600 text-xs mt-2">
                  💡 Tip: You can only request tokens once per hour per wallet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">About Test Tokens</p>
            <ul className="space-y-1 text-xs">
              <li>• Free USDC and ETH for testing on Arbitrum Sepolia</li>
              <li>• Rate limit: 1 request per hour per wallet</li>
              <li>• Tokens have no real value</li>
              <li>• Perfect for learning and testing the platform</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alternative Faucets */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Need more tokens?</p>
        <a
          href="https://faucet.quicknode.com/arbitrum/sepolia"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
        >
          Try QuickNode Faucet
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};