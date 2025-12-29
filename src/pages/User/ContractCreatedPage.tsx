import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CheckCircle, Copy, ExternalLink, ArrowRight, ArrowLeft, Sparkles, DollarSign, Calendar, Loader, AlertCircle } from 'lucide-react';
import { parseUSDC } from '../../hooks/usdc/usdcUtils';
import { formatCurrency, formatYears, formatUSDC } from '../../lib/formatters';

interface LocationState {
  planData: {
    desiredMonthlyIncome: string | number;
    principal: string | number;
    monthlyDeposit: string | number;
    initialDeposit: string | number;
    currentAge: number;
    retirementAge: number;
    yearsPayments: number;
    interestRate: number;
    timelockYears: number;
  };
  totalDeposit: number;
  factoryAddress: string;
}

const ContractCreatedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [fundAddress, setFundAddress] = useState<string>('');
  const state = location.state as LocationState;
  const { planData, totalDeposit, factoryAddress } = state || {};
  const { writeContract, data: txHash, isPending, isError, error: txError } = useWriteContract();
  const { 
    isLoading: isTxPending, 
    isSuccess: isTxSuccess,
    data: receipt 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!planData || !factoryAddress) {
      console.warn('⚠️ No plan data or factory address, redirecting to calculator');
      navigate('/calculator', { replace: true });
    }
  }, [planData, factoryAddress, navigate]);
  useEffect(() => {
    if (isError && txError) {
      console.error('❌ Transaction error:', txError);
      let errorMessage = 'Failed to create retirement fund contract';
      
      if (txError.message?.includes('User rejected') || txError.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (txError.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to complete this transaction.';
      } else if (txError.message) {
        errorMessage = txError.message;
      }
      setError(errorMessage);
    }
  }, [isError, txError]);
  useEffect(() => {
    if (isTxSuccess && receipt) {
      console.log('✅ Transaction successful!', receipt);
      // TODO: Parsear los logs para obtener la dirección del contrato creado
      // Por ahora usamos un placeholder
      const createdFundAddress = '0x...';
      setFundAddress(createdFundAddress);
    }
  }, [isTxSuccess, receipt]);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!planData || !factoryAddress) {
      setError('Missing plan data. Please start over.');
      return;
    }

    setError('');
    try {
      console.log('🚀 Creating retirement fund contract...');
      const initialDepositAmount = parseUSDC(Number(planData.initialDeposit).toFixed(2));
      const monthlyDepositAmount = parseUSDC(Number(planData.monthlyDeposit).toFixed(2));
      const desiredMonthlyAmount = parseUSDC(Number(planData.desiredMonthlyIncome).toFixed(2));
      const factoryABI = [
        {
          name: 'createPersonalFund',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'initialDeposit', type: 'uint256' },
            { name: 'monthlyDeposit', type: 'uint256' },
            { name: 'desiredMonthly', type: 'uint256' },
            { name: 'currentAge', type: 'uint8' },
            { name: 'retirementAge', type: 'uint8' },
            { name: 'timelockYears', type: 'uint8' },
          ],
          outputs: [{ name: '', type: 'address' }],
        },
      ] as const;

      writeContract({
        address: factoryAddress as `0x${string}`,
        abi: factoryABI,
        functionName: 'createPersonalFund',
        args: [
          initialDepositAmount,
          monthlyDepositAmount,
          desiredMonthlyAmount,
          planData.currentAge,
          planData.retirementAge,
          planData.timelockYears,
        ],
      });

      console.log('✅ Transaction submitted');
      
    } catch (err: any) {
      console.error('❌ Error creating contract:', err);
      let errorMessage = 'Failed to create retirement fund contract';

      if (err.message?.includes('User rejected') || err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again and approve the transaction.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to complete this transaction.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  if (!planData) {
    return null;
  }
  if (isTxSuccess && txHash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-4 border-emerald-300 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-12 text-center text-white">
              <CheckCircle className="w-32 h-32 mx-auto mb-6 animate-bounce" />
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                Contract Created Successfully! 🎉
              </h1>
              <p className="text-lg sm:text-xl opacity-90">
                Your retirement fund is now on the blockchain
              </p>
            </div>

            {/* Details */}
            <div className="p-8 sm:p-12 space-y-8">
              {/* Fund Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-emerald-600" size={20} />
                    <p className="text-gray-600 font-semibold">Initial Deposit</p>
                  </div>
                  <p className="text-4xl font-black text-emerald-700">
                    {formatCurrency(planData.initialDeposit || 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    97% returned to you for DeFi investment
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-blue-600" size={20} />
                    <p className="text-gray-600 font-semibold">Monthly Deposit</p>
                  </div>
                  <p className="text-4xl font-black text-blue-700">
                    {formatCurrency(planData.monthlyDeposit || 0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Required to meet your retirement goal
                  </p>
                </div>
              </div>

              {/* Contract Address */}
              {fundAddress && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <p className="text-gray-700 font-bold text-lg mb-3">Your Fund Contract Address</p>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-purple-300">
                    <code className="flex-1 text-sm font-mono text-purple-800 break-all">
                      {fundAddress}
                    </code>
                    <button
                      onClick={() => copyToClipboard(fundAddress)}
                      className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition flex-shrink-0"
                      title="Copy contract address"
                    >
                      <Copy size={20} />
                    </button>
                    <a
                      href={`https://sepolia.arbiscan.io/address/${fundAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition flex-shrink-0"
                      title="View contract on Arbiscan"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
              <div className="space-y-4">
                <p className="text-gray-700 font-bold text-lg">Transaction Hash</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                    {txHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition flex-shrink-0"
                    title="Copy transaction hash"
                  >
                    <Copy size={20} />
                  </button>
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition flex-shrink-0"
                    title="View on Arbiscan"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                {copied && (
                  <p className="text-green-600 font-semibold text-center animate-pulse">
                    ✅ Copied to clipboard
                  </p>
                )}
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Sparkles className="text-purple-600" />
                  Next Steps
                </h3>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Go to Dashboard</strong> to view your fund details and balance
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Make monthly deposits</strong> of {formatCurrency(planData.monthlyDeposit || 0)} to stay on track
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Monitor your progress</strong> and adjust your plan as needed
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Invest your funds</strong> in approved DeFi protocols to earn returns
                    </div>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
              >
                Go to Dashboard
                <ArrowRight size={32} />
              </button>

              {/* Info Footer */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-800">
                  💡 <strong>Remember:</strong> This is on Arbitrum Sepolia testnet. 
                  These are test tokens with no real value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-indigo-300 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 sm:p-12 text-center text-white">
            <Sparkles className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-5xl font-black mb-4">
              Confirm Your Retirement Fund
            </h1>
            <p className="text-base sm:text-xl opacity-90">
              Review your details and confirm to create your smart contract
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {(isPending || isTxPending) && (
            <div className="p-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Loader className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 mb-1">
                    {isPending ? 'Waiting for confirmation...' : 'Creating your fund...'}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {isPending 
                      ? 'Please confirm the transaction in your wallet' 
                      : 'Your transaction is being processed on the blockchain'
                    }
                  </p>
                  {txHash && (
                    <p className="text-xs text-blue-600 mt-2 font-mono break-all">
                      TX: {txHash}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="p-6 sm:p-12 space-y-6">
            {/* Fund Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-emerald-600" size={20} />
                  <p className="text-gray-600 font-semibold">Total Initial Deposit</p>
                </div>
                <p className="text-4xl font-black text-emerald-700">
                  {formatCurrency(totalDeposit || 0)}
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Principal:</p>
                    <p className="font-bold text-gray-800">{formatCurrency(planData.principal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">First Monthly:</p>
                    <p className="font-bold text-gray-800">{formatCurrency(planData.monthlyDeposit)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-blue-600" size={20} />
                  <p className="text-gray-600 font-semibold">Monthly Deposit</p>
                </div>
                <p className="text-4xl font-black text-blue-700">
                  {formatCurrency(planData.monthlyDeposit || 0)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Required to meet your retirement goal
                </p>
              </div>
            </div>

            {/* Plan Details */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Your Plan Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Age:</p>
                  <p className="font-bold text-gray-800">{planData.currentAge} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Retirement Age:</p>
                  <p className="font-bold text-gray-800">{planData.retirementAge} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Desired Monthly Income:</p>
                  <p className="font-bold text-blue-700">{formatCurrency(planData.desiredMonthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Timelock Period:</p>
                  <p className="font-bold text-gray-800">{planData.timelockYears} years</p>
                </div>
              </div>
            </div>

            {/* Fee Info */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <h3 className="font-bold text-amber-900 text-lg mb-3">Important: Fee Breakdown</h3>
              <div className="space-y-2 text-sm text-amber-800">
                <p>• <strong>3% fee</strong> will be deducted and sent to Ethernity DAO Treasury</p>
                <p>• <strong>97%</strong> of your deposit ({formatCurrency(totalDeposit * 0.97)}) will be returned to you</p>
                <p>• This fee applies to ALL deposits (initial and monthly)</p>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleConfirm}
                disabled={isPending || isTxPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
              >
                {isPending || isTxPending ? (
                  <>
                    <Loader className="animate-spin" size={32} />
                    {isPending ? 'Confirm in Wallet...' : 'Creating Fund...'}
                  </>
                ) : (
                  <>
                    <CheckCircle size={32} />
                    Confirm & Create Fund
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/create-contract')}
                disabled={isPending || isTxPending}
                className="w-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCreatedPage;
