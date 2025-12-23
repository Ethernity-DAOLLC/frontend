import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChainId } from 'wagmi';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useWallet } from '@/hooks/web3/useWallet';
import { usePersonalFundFactory } from '@/hooks/funds/usePersonalFundFactory';
import { CONTRACT_ADDRESSES } from '@/config/addresses';
import { parseUSDC } from '@/hooks/usdc/usdcUtils';
import { formatCurrency, formatYears } from '@/lib';
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
  Loader,
} from 'lucide-react';

const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const chainId = useChainId();
  const { planData, clearPlanData } = useRetirementPlan();
  const { isConnected, openModal } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // ✅ Factory address dinámico según la red conectada
  const factoryAddress = CONTRACT_ADDRESSES[chainId]?.personalFundFactory;

  const {
    createPersonalFund,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    creationStep,
    usdcBalance,
    usdcAllowance,
    configuration,
    refetch,
  } = usePersonalFundFactory(factoryAddress);

  useEffect(() => {
    if (!planData) {
      navigate('/calculator', { replace: true });
    }
  }, [planData, navigate]);

  useEffect(() => {
    if (isSuccess && hash) {
      setTimeout(() => {
        navigate('/contract-created', {
          state: {
            txHash: hash,
            initialDeposit: planData?.initialDeposit || '0',
            monthlyDeposit: planData?.monthlyDeposit || '0',
            fundAddress: '', // TODO: Obtener del evento FundCreated
          },
        });
        clearPlanData();
      }, 2000);
    }
  }, [isSuccess, hash, navigate, planData, clearPlanData]);

  if (!planData) {
    return null;
  }

  // ✅ Verificar que exista el factory en esta red
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
  
  // ✅ Usar los valores directamente de planData sin recalcular
  // Solo convertimos a unidades USDC (6 decimales)
  const principalAmount = parseUSDC(planData.principal);
  const monthlyDepositAmount = parseUSDC(planData.monthlyDeposit);
  const initialDepositAmount = parseUSDC(planData.initialDeposit);
  const desiredMonthlyAmount = parseUSDC(planData.desiredMonthlyIncome.toString());
  
  const handleConnectWallet = () => {
    openModal();
  };

  const handleCreateContract = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      await createPersonalFund({
        principal: principalAmount,
        monthlyDeposit: monthlyDepositAmount,
        currentAge: planData.currentAge,
        retirementAge: planData.retirementAge,
        desiredMonthly: desiredMonthlyAmount,  // ✅ Número en unidades USDC
        yearsPayments: planData.yearsPayments,
        interestRate: Math.round(planData.interestRate * 100),
        timelockYears: planData.timelockYears,
      });
    } catch (err: any) {
      console.error('Error creating fund:', err);
      setError(err.message || 'Failed to create retirement fund');
      setIsProcessing(false);
    }
  };
  
  // ✅ Calcular fees SOLO para mostrar al usuario (no modifica los valores enviados al contrato)
  const feeAmount = (parseFloat(planData.initialDeposit) * 0.03).toFixed(2);
  const netToOwner = (parseFloat(planData.initialDeposit) * 0.97).toFixed(2);
  const hasEnoughBalance = usdcBalance && usdcBalance >= initialDepositAmount;
  const hasEnoughAllowance = usdcAllowance && usdcAllowance >= initialDepositAmount;

  const getStepMessage = () => {
    if (creationStep === 'approving') return 'Step 1/2: Approving USDC... Please confirm in your wallet';
    if (creationStep === 'creating') return 'Step 2/2: Creating your retirement fund... Please confirm in your wallet';
    if (isConfirming) return 'Confirming transaction on blockchain...';
    if (isSuccess) return 'Success! Redirecting to confirmation page...';
    return '';
  };

  const canCreate = isConnected && hasEnoughBalance && !isProcessing && !isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3 sm:gap-4">
            <Shield className="text-indigo-600" size={40} />
            <span className="hidden sm:inline">Create Your Retirement Fund</span>
            <span className="sm:hidden">Create Fund</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Review your plan details and create your smart contract on Arbitrum Sepolia
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {(isPending || isConfirming || isSuccess) && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              {isSuccess ? (
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <Loader className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-1">
                  {isSuccess ? 'Success!' : 'Processing Transaction...'}
                </h3>
                <p className="text-blue-700 text-sm">{getStepMessage()}</p>
                {creationStep && !isSuccess && (
                  <div className="mt-3 bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <div className={`w-2 h-2 rounded-full ${creationStep === 'approving' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                      <span>Approve USDC</span>
                      <div className={`w-2 h-2 rounded-full ${creationStep === 'creating' ? 'bg-blue-500 animate-pulse' : creationStep === 'approving' ? 'bg-gray-300' : 'bg-green-500'}`} />
                      <span>Create Fund</span>
                    </div>
                  </div>
                )}
              </div>
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
                  Initial Deposit (Principal + First Monthly)
                </p>
                <p className="text-4xl font-black text-emerald-700">
                  {formatCurrency(parseFloat(planData.initialDeposit))}
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Principal:</p>
                    <p className="font-bold text-gray-800">{formatCurrency(parseFloat(planData.principal))}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">First Monthly:</p>
                    <p className="font-bold text-gray-800">{formatCurrency(parseFloat(planData.monthlyDeposit))}</p>
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
                    {formatCurrency(parseFloat(planData.monthlyDeposit))}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Current Age
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {planData.currentAge} years
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Retirement Age
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {planData.retirementAge} years
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <TrendingUp size={14} />
                    Years to Retire
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {planData.retirementAge - planData.currentAge} years
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <DollarSign size={14} />
                    Desired Monthly Income
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(planData.desiredMonthlyIncome)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Your retirement goal</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Clock size={14} />
                    Payment Years
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatYears(planData.yearsPayments)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Percent size={14} />
                    Interest Rate
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {planData.interestRate}%
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                    <Lock size={14} />
                    Timelock
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatYears(planData.timelockYears)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Breakdown & Actions */}
          <div className="space-y-6">
            {/* Fee Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 flex items-center gap-3">
                <Info className="w-6 h-6" />
                Fee Breakdown (Initial Deposit)
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow">
                  <p className="text-gray-600 text-sm">Total Initial Deposit</p>
                  <p className="text-3xl font-black text-gray-800">
                    {formatCurrency(parseFloat(planData.initialDeposit))}
                  </p>
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
                  💡 <strong>Note:</strong> The same 3% fee applies to all monthly deposits
                </p>
              </div>
            </div>

            {/* Balance Check */}
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-6 border border-purple-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Wallet className="text-indigo-600" size={24} />
                Wallet Balance
              </h3>
              
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
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 text-sm">Your USDC Balance:</span>
                      <span className="font-bold text-gray-800 text-lg">
                        {usdcBalance !== undefined 
                          ? formatCurrency(parseFloat((Number(usdcBalance) / 1e6).toFixed(2))) 
                          : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Required Amount:</span>
                      <span className="font-bold text-indigo-700 text-lg">
                        {formatCurrency(parseFloat(planData.initialDeposit))}
                      </span>
                    </div>
                  </div>

                  {hasEnoughBalance ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">Balance OK</p>
                        <p className="text-sm text-green-800">You have sufficient USDC to create your retirement fund</p>
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
                            {formatCurrency(parseFloat((Number(initialDepositAmount - (usdcBalance || BigInt(0))) / 1e6).toFixed(2)))}
                          </strong>{' '}
                          more USDC.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
              <h2 className="text-2xl sm:text-3xl font-black mb-4">
                {isConnected ? 'Ready to Create' : 'Connect Your Wallet'}
              </h2>
              <p className="text-sm sm:text-base mb-6 opacity-90">
                {isConnected
                  ? 'Your smart contract will be created on Arbitrum Sepolia'
                  : 'Connect your wallet to create your retirement fund'}
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
                    disabled={!canCreate}
                    className="w-full bg-white text-indigo-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader className="animate-spin" size={24} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield size={24} />
                        Create My Fund
                        <ArrowRight size={24} />
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigate('/calculator')}
                  disabled={isPending || isConfirming}
                  className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
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
              <h4 className="font-bold text-blue-900 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your fund will be created as a smart contract on Arbitrum Sepolia</li>
                <li>• You'll need to approve 2 transactions: (1) Approve USDC, (2) Create Fund</li>
                <li>• 3% fee applies to initial deposit AND all monthly deposits</li>
                <li>• 97% of each deposit is returned to you for DeFi investment</li>
                <li>• You retain full control of your funds through the smart contract</li>
                <li>• The timelock ensures funds are secured until retirement age</li>
                <li>• Your desired monthly income ({formatCurrency(planData.desiredMonthlyIncome)}) is saved as your retirement goal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContractPage;