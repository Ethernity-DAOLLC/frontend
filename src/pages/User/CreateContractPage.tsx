import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useEstimateGas, usePublicClient } from 'wagmi';
import { ArrowRight, ArrowLeft, Sparkles, DollarSign, Calendar, AlertCircle, Zap, Info } from 'lucide-react';
import { parseUnits, formatEther } from 'viem';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const FEE_PERCENTAGE = 0.03;
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

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
  factoryAddress: string;
}

interface GasEstimate {
  approvalGas: bigint;
  createFundGas: bigint;
  totalGasEstimate: bigint;
  estimatedCostEth: string;
  estimatedCostUsd: string;
}

const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const state = location.state as LocationState;
  const { planData, factoryAddress } = state || {};
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!planData || !factoryAddress) {
      console.warn('⚠️ No plan data or factory address, redirecting to calculator');
      navigate('/calculator', { replace: true });
    }
  }, [planData, factoryAddress, navigate]);
  const parseUSDC = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return BigInt(Math.round(num * 1_000_000));
  };

  useEffect(() => {
    if (planData && factoryAddress && address) {
      estimateGasCosts();
    }
  }, [planData, factoryAddress, address]);

  const estimateGasCosts = async () => {
    if (!planData || !factoryAddress || !address || !publicClient) return;

    setIsEstimating(true);
    setError('');

    try {
      const requiredAmount = parseUSDC(planData.initialDeposit);
      const approvalGas = await publicClient.estimateContractGas({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress as `0x${string}`, requiredAmount],
        account: address,
      });
      const args = [
        parseUSDC(planData.initialDeposit),
        parseUSDC(planData.monthlyDeposit),
        BigInt(planData.currentAge),
        BigInt(planData.retirementAge),
        parseUSDC(planData.desiredMonthlyIncome),
        BigInt(planData.yearsPayments),
        BigInt(Math.round(planData.interestRate * 100)),
        BigInt(planData.timelockYears),
      ];

      const createFundGas = await publicClient.estimateContractGas({
        address: factoryAddress as `0x${string}`,
        abi: PersonalFundFactoryABI,
        functionName: 'createPersonalFund',
        args,
        account: address,
      });

      const gasPrice = await publicClient.getGasPrice();
      const totalGasEstimate = (approvalGas + createFundGas) * 12n / 10n;
      const totalCostWei = totalGasEstimate * gasPrice;
      const estimatedCostEth = formatEther(totalCostWei);
      const estimatedCostUsd = (parseFloat(estimatedCostEth) * 2000).toFixed(2);

      setGasEstimate({
        approvalGas: approvalGas * 12n / 10n,
        createFundGas: createFundGas * 12n / 10n,
        totalGasEstimate,
        estimatedCostEth: parseFloat(estimatedCostEth).toFixed(6),
        estimatedCostUsd,
      });

      console.log('⛽ Gas Estimates:', {
        approval: approvalGas.toString(),
        createFund: createFundGas.toString(),
        total: totalGasEstimate.toString(),
        costEth: estimatedCostEth,
      });

    } catch (err: any) {
      console.error('❌ Gas estimation failed:', err);
      setError('Failed to estimate gas. Please check your inputs.');
      setGasEstimate({
        approvalGas: 100000n,
        createFundGas: 500000n,
        totalGasEstimate: 720000n, // 600k + 20%
        estimatedCostEth: '0.001',
        estimatedCostUsd: '2.00',
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleProceed = () => {
    if (!planData || !factoryAddress) return;
    navigate('/contract-created', {
      state: {
        planData,
        factoryAddress,
        gasEstimate,
      },
    });
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (!planData) {
    return null;
  }
  const feeAmount = parseFloat(planData.initialDeposit.toString()) * FEE_PERCENTAGE;
  const netToOwner = parseFloat(planData.initialDeposit.toString()) - feeAmount;
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-indigo-300 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 sm:p-12 text-center text-white">
            <Sparkles className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-5xl font-black mb-4">Review Your Retirement Plan</h1>
            <p className="text-base sm:text-xl opacity-90">
              Verify all details before proceeding to contract creation
            </p>
          </div>
          {error && (
            <div className="p-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-1">Warning</h3>
                  <p className="text-amber-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-12 space-y-6">
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
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-blue-600" size={20} />
                  <p className="text-gray-600 font-semibold">Monthly Deposit</p>
                </div>
                <p className="text-4xl font-black text-blue-700">
                  {formatCurrency(planData.monthlyDeposit || 0)}
                </p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-3">
                <Info className="w-6 h-6" />
                Initial Deposit Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-gray-600 text-sm">Total Deposit</p>
                  <p className="text-2xl font-black text-gray-800">
                    {formatCurrency(planData.initialDeposit)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-gray-600 text-sm">DAO Fee (3%)</p>
                  <p className="text-2xl font-black text-orange-600">
                    {formatCurrency(feeAmount)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-gray-600 text-sm">Net to Fund (97%)</p>
                  <p className="text-2xl font-black text-green-600">
                    {formatCurrency(netToOwner)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                <Zap className="text-purple-600" size={20} />
                Plan Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Age</p>
                  <p className="font-bold text-gray-800">{planData.currentAge} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Retirement Age</p>
                  <p className="font-bold text-gray-800">{planData.retirementAge} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Years to Retirement</p>
                  <p className="font-bold text-gray-800">
                    {planData.retirementAge - planData.currentAge} years
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Period</p>
                  <p className="font-bold text-gray-800">{planData.yearsPayments} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Expected Rate</p>
                  <p className="font-bold text-gray-800">{planData.interestRate}% APY</p>
                </div>
                <div>
                  <p className="text-gray-600">Timelock Period</p>
                  <p className="font-bold text-gray-800">{planData.timelockYears} years</p>
                </div>
              </div>
            </div>
            {isEstimating ? (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                  <p className="text-amber-800 font-semibold">Estimating gas costs...</p>
                </div>
              </div>
            ) : gasEstimate && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-amber-600" size={24} />
                  <h3 className="font-bold text-amber-900 text-lg">Estimated Gas Cost</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-gray-600 text-sm mb-1">Approval Transaction</p>
                    <p className="text-lg font-bold text-gray-800">
                      {gasEstimate.approvalGas.toString()} gas
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-gray-600 text-sm mb-1">Create Fund Transaction</p>
                    <p className="text-lg font-bold text-gray-800">
                      {gasEstimate.createFundGas.toString()} gas
                    </p>
                  </div>
                </div>
                <div className="bg-amber-100 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-amber-900 font-semibold">Total Estimated Cost:</span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-700">
                      ~{gasEstimate.estimatedCostEth} ETH
                    </p>
                    <p className="text-sm text-amber-600">(~${gasEstimate.estimatedCostUsd} USD)</p>
                  </div>
                </div>
                <p className="text-xs text-amber-800 mt-3">
                  * Estimate includes 20% buffer. Actual cost may vary based on network conditions.
                </p>
              </div>
            )}
            <div className="space-y-4">
              <button
                onClick={handleProceed}
                disabled={isEstimating}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
              >
                {isEstimating ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    Estimating...
                  </>
                ) : (
                  <>
                    Proceed to Create Contract
                    <ArrowRight size={32} />
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/calculator')}
                disabled={isEstimating}
                className="w-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Calculator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateContractPage;