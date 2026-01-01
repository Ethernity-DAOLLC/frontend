import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CheckCircle, Copy, ExternalLink, ArrowRight, ArrowLeft, Sparkles, DollarSign, Calendar, Loader2, AlertCircle, Zap } from 'lucide-react';
import { parseUnits } from 'viem';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
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
  gasEstimate?: {
    approvalGas: bigint;
    createFundGas: bigint;
    totalGasEstimate: bigint;
    estimatedCostEth: string;
    estimatedCostUsd: string;
  };
}
type TransactionStep = 'idle' | 'approving' | 'approved' | 'creating' | 'success' | 'error';

const ContractCreatedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [fundAddress, setFundAddress] = useState<string>('');
  const [step, setStep] = useState<TransactionStep>('idle');
  const state = location.state as LocationState;
  const { planData, factoryAddress, gasEstimate } = state || {};
  const { 
    writeContract: writeApproval, 
    data: approvalHash, 
    isPending: isApprovalPending,
    error: approvalError 
  } = useWriteContract();

  const { 
    isLoading: isApprovalConfirming, 
    isSuccess: isApprovalSuccess 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });
  const { 
    writeContract: writeCreateFund, 
    data: txHash, 
    isPending: isCreatePending,
    error: createError 
  } = useWriteContract();

  const { 
    isLoading: isTxConfirming, 
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
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      console.log('✅ Approval confirmed, creating fund...');
      setStep('approved');
      
      setTimeout(() => {
        handleCreateFund();
      }, 1500);
    }
  }, [isApprovalSuccess, approvalHash, step]);
  useEffect(() => {
    if (approvalError && step === 'approving') {
      console.error('❌ Approval error:', approvalError);
      setError(`Approval failed: ${(approvalError as any)?.shortMessage || approvalError.message}`);
      setStep('error');
    }
  }, [approvalError, step]);
  useEffect(() => {
    if (createError && step === 'creating') {
      console.error('❌ Create fund error:', createError);
      setError(`Transaction failed: ${(createError as any)?.shortMessage || createError.message}`);
      setStep('error');
    }
  }, [createError, step]);
  useEffect(() => {
    if (isTxSuccess && receipt && step === 'creating') {
      console.log('✅ Transaction successful!', receipt);
      setStep('success');
      const createdFundAddress = '0x...';
      setFundAddress(createdFundAddress);
    }
  }, [isTxSuccess, receipt, step]);
  const parseUSDC = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return BigInt(Math.round(num * 1_000_000));
  };
  const handleApproveUSDC = async () => {
    if (!planData || !factoryAddress || !address) {
      setError('Missing required data');
      return;
    }
    setError('');
    setStep('approving');
    try {
      console.log('🔐 Approving USDC...');
      const requiredAmount = parseUSDC(planData.initialDeposit);
      
      writeApproval({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress as `0x${string}`, requiredAmount],
        gas: 100000n,
      } as any);
    } catch (err: any) {
      console.error('❌ Error approving USDC:', err);
      setError(err.message || 'Failed to approve USDC');
      setStep('error');
    }
  };

  const handleCreateFund = async () => {
    if (!planData || !factoryAddress) {
      setError('Missing plan data');
      return;
    }
    setStep('creating');
    try {
      console.log('🚀 Creating retirement fund contract...');
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
      writeCreateFund({
        address: factoryAddress as `0x${string}`,
        abi: PersonalFundFactoryABI,
        functionName: 'createPersonalFund',
        args,
        gas: 500000n,
      } as any);

      console.log('✅ Transaction submitted');
    } catch (err: any) {
      console.error('❌ Error creating contract:', err);
      setError(err.message || 'Failed to create retirement fund contract');
      setStep('error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  if (step === 'success' && txHash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-4 border-emerald-300 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-12 text-center text-white">
              <CheckCircle className="w-32 h-32 mx-auto mb-6 animate-bounce" />
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                Contract Created Successfully! 🎉
              </h1>
              <p className="text-lg sm:text-xl opacity-90">
                Your retirement fund is now on the blockchain
              </p>
            </div>
            <div className="p-8 sm:p-12 space-y-8">
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
                  >
                    <Copy size={20} />
                  </button>
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition flex-shrink-0"
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
                </ul>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
              >
                Go to Dashboard
                <ArrowRight size={32} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-indigo-300 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 sm:p-12 text-center text-white">
            <Sparkles className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-5xl font-black mb-4">
              Confirm Your Retirement Fund
            </h1>
            <p className="text-base sm:text-xl opacity-90">
              Click confirm to execute the transactions
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
                <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 font-bold">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {step !== 'idle' && step !== 'error' && (
            <div className="p-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Loader2 className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-1">
                      {step === 'approving' && 'Step 1/2: Approving USDC...'}
                      {step === 'approved' && 'Step 1/2: Approval confirmed ✓'}
                      {step === 'creating' && 'Step 2/2: Creating your fund...'}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      {step === 'approving' && 'Please confirm the approval in your wallet'}
                      {step === 'approved' && 'Preparing to create your fund contract'}
                      {step === 'creating' && 'Please confirm the transaction in your wallet'}
                    </p>
                    {(approvalHash || txHash) && (
                      <p className="text-xs text-blue-600 mt-2 font-mono break-all">
                        TX: {approvalHash || txHash}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex-1 h-2 rounded-full ${step === 'approving' || step === 'approved' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 h-2 rounded-full ${step === 'creating' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Approve USDC</span>
                    <span>Create Fund</span>
                  </div>
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

            {/* Gas Estimate */}
            {gasEstimate && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="text-amber-600" size={20} />
                  <h3 className="font-bold text-amber-900">Estimated Gas Cost</h3>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">You will pay approximately:</span>
                  <strong className="text-amber-700 text-2xl">~{gasEstimate.estimatedCostEth} ETH</strong>
                </div>
                <p className="text-xs text-amber-800 mt-2">
                  This covers both the approval and fund creation transactions
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleApproveUSDC}
                disabled={step !== 'idle'}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
              >
                {step === 'idle' ? (
                  <>
                    <CheckCircle size={32} />
                    Confirm & Create Fund
                  </>
                ) : (
                  <>
                    <Loader2 className="animate-spin" size={32} />
                    Processing...
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/create-contract')}
                disabled={step !== 'idle'}
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