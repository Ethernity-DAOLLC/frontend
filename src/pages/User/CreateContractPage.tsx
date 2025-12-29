import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChainId } from 'wagmi';
import { useRetirementPlan } from '../../context/RetirementContext';
import { useWallet } from '../../hooks/web3/useWallet';
import { useUSDC } from '../../hooks/usdc/useUSDC';
import { CONTRACT_ADDRESSES } from '../../config/addresses';
import { parseUSDC } from '../../hooks/usdc/usdcUtils';
import {
  Wallet,
  Shield,
  DollarSign,
  Calendar,
  TrendingUp,
  Percent,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  Info,
} from 'lucide-react';

const formatCurrency = (num: string | number | null | undefined): string => {
  const value = Number(num);
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(value);
};

const formatYears = (years: number | null | undefined): string => {
  const safeYears = years || 0;
  return safeYears === 1 ? '1 year' : `${safeYears} years`;
};

const bigintToNumber = (value: bigint | undefined, decimals: number = 6): number => {
  if (!value) return 0;
  return Number(value) / Math.pow(10, decimals);
};
const safeParseFloat = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
};
const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const chainId = useChainId();
  const { planData } = useRetirementPlan();
  const { isConnected, openModal } = useWallet();
  const [error, setError] = useState<string>('');
  const factoryAddress = CONTRACT_ADDRESSES[chainId]?.personalFundFactory;
  const usdcAddress = CONTRACT_ADDRESSES[chainId]?.usdc;
  const { 
    balance: usdcBalance, 
    refetchBalance,
  } = useUSDC(usdcAddress);

  useEffect(() => {
    if (!planData) {
      console.warn('⚠️ No plan data found, redirecting to calculator');
      navigate('/calculator', { replace: true });
    }
  }, [planData, navigate]);

  useEffect(() => {
    if (isConnected && refetchBalance) {
      refetchBalance();
    }
  }, [isConnected, refetchBalance]);

  if (!planData) {
    return null;
  }

  if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Contracts Not Deployed
            </h2>
            <p className="text-red-700 mb-6">
              The retirement fund contracts are not deployed on this network yet.
              Please switch to Arbitrum Sepolia.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              Back to Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const desiredMonthlyValue = safeParseFloat(planData.desiredMonthlyIncome, 0);
  const principalValue = safeParseFloat(planData.principal, 0);
  const monthlyDepositValue = safeParseFloat(planData.monthlyDeposit, 0);
  const initialDepositValue = safeParseFloat(planData.initialDeposit, 0);
  const currentAge = planData.currentAge || 0;
  const retirementAge = planData.retirementAge || 0;
  const yearsPayments = planData.yearsPayments || 0;
  const interestRate = planData.interestRate || 0;
  const timelockYears = planData.timelockYears || 0;
  const totalDepositAmount = initialDepositValue + monthlyDepositValue;

  if (initialDepositValue <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Invalid Plan Data
            </h2>
            <p className="text-red-700 mb-6">
              The initial deposit amount is invalid. Please recalculate your plan.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              Back to Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  let totalDepositBigInt: bigint;
  try {
    totalDepositBigInt = parseUSDC(totalDepositAmount.toFixed(2));
  } catch (err) {
    console.error('❌ Error parsing USDC amounts:', err);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Error Processing Amounts
            </h2>
            <p className="text-red-700 mb-6">
              There was an error processing your deposit amounts. Please try again.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              Back to Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConnectWallet = () => {
    try {
      if (openModal) {
        openModal();
      }
    } catch (err) {
      console.error('❌ Error opening wallet modal:', err);
      setError('Failed to open wallet connection. Please try again.');
    }
  };

  const handleCreateContract = () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      if (openModal) {
        openModal();
      }
      return;
    }
    if (!hasEnoughBalance) {
      setError('Insufficient USDC balance. Please deposit more funds.');
      return;
    }
    navigate('/contract-created', {
      state: {
        planData: planData,
        totalDeposit: totalDepositAmount,
        factoryAddress: factoryAddress
      }
    });
  };

  const feeAmount = (totalDepositAmount * 0.03).toFixed(2);
  const netToOwner = (totalDepositAmount * 0.97).toFixed(2);
  const hasEnoughBalance = 
    usdcBalance !== undefined && 
    usdcBalance !== null && 
    totalDepositBigInt !== undefined &&
    usdcBalance >= totalDepositBigInt;
  const canProceed = isConnected && hasEnoughBalance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3 sm:gap-4">
            <Shield className="text-indigo-600" size={40} />
            <span className="hidden sm:inline">Review Your Retirement Plan</span>
            <span className="sm:hidden">Review Plan</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Verify your balance and plan details before creating your fund
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 font-bold"
                aria-label="Close error message"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Plan Details */}
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Sparkles className="text-purple-600" />
              Your Plan Details
            </h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                <p className="text-gray-600 text-sm mb-1 flex items-center gap-2">
                  <DollarSign size={16} />
                  Total Initial Deposit
                </p>
                <p className="text-4xl font-black text-emerald-700">
                  {formatCurrency(totalDepositAmount)}
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Principal:</p>
                    <p className="font-bold text-gray-800">{formatCurrency(principalValue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">First Monthly:</p>
                    <p className="font-bold text-gray-800">{formatCurrency(monthlyDepositValue)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <DollarSign size={14} />
                    Monthly Deposit
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(monthlyDepositValue)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Current Age
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {currentAge} years
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Retirement Age
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {retirementAge} years
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <TrendingUp size={14} />
                    Years to Retire
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {retirementAge - currentAge} years
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <DollarSign size={14} />
                    Desired Monthly Income
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(desiredMonthlyValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Your retirement goal</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Clock size={14} />
                    Payment Years
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatYears(yearsPayments)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Percent size={14} />
                    Interest Rate
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {interestRate.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Lock size={14} />
                    Timelock
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatYears(timelockYears)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Fee Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 flex items-center gap-3">
                <Info className="w-6 h-6" />
                Fee Breakdown
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow">
                  <p className="text-gray-600 text-sm">Total Deposit (USDC)</p>
                  <p className="text-3xl font-black text-gray-800">
                    {formatCurrency(totalDepositAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Initial + First Monthly</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow">
                  <p className="text-gray-600 text-sm">Ethernity DAO Fee (3%)</p>
                  <p className="text-3xl font-black text-orange-600">
                    {formatCurrency(parseFloat(feeAmount))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Goes to Treasury</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow">
                  <p className="text-gray-600 text-sm">Net Returned to You (97%)</p>
                  <p className="text-3xl font-black text-green-600">
                    {formatCurrency(parseFloat(netToOwner))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">For DeFi Investment</p>
                </div>
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> The same 3% fee applies to all monthly deposits
                </p>
              </div>
            </div>

            {/* Balance Check */}
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Wallet className="text-indigo-600" size={24} />
                  Wallet Balance
                </h3>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-semibold">
                  Test Mode
                </span>
              </div>
              {!isConnected ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Wallet Not Connected</p>
                      <p className="text-sm text-amber-800">Please connect your wallet to check your USDC balance</p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectWallet}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Wallet size={20} />
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                    <p className="text-xs text-blue-800">
                      <strong>ℹ️ Test Mode:</strong> Using Mock USDC for testing. Need test tokens?{' '}
                      <a 
                        href={`https://sepolia.arbiscan.io/address/${usdcAddress}#writeContract`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold hover:text-blue-900"
                      >
                        Mint here
                      </a>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">Your USDC Balance:</span>
                      <span className="font-bold text-gray-800 text-lg">
                        {usdcBalance !== undefined && usdcBalance !== null
                          ? formatCurrency(bigintToNumber(usdcBalance, 6))
                          : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Required Amount:</span>
                      <span className="font-bold text-indigo-700 text-lg">
                        {formatCurrency(totalDepositAmount)}
                      </span>
                    </div>
                  </div>
                  {hasEnoughBalance ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">Sufficient Balance!</p>
                        <p className="text-sm text-green-800">
                          You have enough USDC to create your retirement fund
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-red-900 mb-1">Insufficient Balance</p>
                        <p className="text-sm text-red-800">
                          Please deposit more USDC. You need{' '}
                          <strong>
                            {formatCurrency(
                              bigintToNumber(
                                totalDepositBigInt - (usdcBalance || 0n),
                                6
                              )
                            )}
                          </strong>{' '}
                          more USDC.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
              <h2 className="text-2xl sm:text-3xl font-black mb-4">
                Ready to Create Your Fund?
              </h2>
              <p className="text-sm sm:text-base mb-6 opacity-90">
                {canProceed 
                  ? 'Your wallet has sufficient balance. Proceed to create your contract!'
                  : 'Connect your wallet and ensure you have enough USDC'
                }
              </p>

              <div className="space-y-4">
                {!isConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full bg-white text-indigo-700 hover:bg-gray-100 px-6 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    <Wallet size={24} />
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    onClick={handleCreateContract}
                    disabled={!canProceed}
                    className="w-full bg-white text-indigo-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    Create Contract
                    <ArrowRight size={24} />
                  </button>
                )}

                <button
                  onClick={() => navigate('/calculator')}
                  className="w-full bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back to Calculator
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 max-w-4xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-blue-900 mb-2">What's Next?</h4>
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-3">
                <p className="text-sm text-amber-900 font-semibold mb-1">🧪 Test Environment</p>
                <p className="text-xs text-amber-800">
                  This app uses Mock USDC on Arbitrum Sepolia for testing. Get free test tokens from the{' '}
                  <a 
                    href={`https://sepolia.arbiscan.io/address/${usdcAddress}#writeContract`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold hover:text-amber-900"
                  >
                    Mock USDC contract
                  </a>
                </p>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click "Create Contract" to proceed to the confirmation page</li>
                <li>• You'll review all details and confirm the transaction</li>
                <li>• Your fund will be created as a smart contract on Arbitrum Sepolia</li>
                <li>• You'll need to approve the transaction in your wallet</li>
                <li>• 3% fee applies to initial deposit AND all monthly deposits</li>
                <li>• 97% of each deposit is returned to you for DeFi investment</li>
                <li>• You retain full control of your funds through the smart contract</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContractPage;