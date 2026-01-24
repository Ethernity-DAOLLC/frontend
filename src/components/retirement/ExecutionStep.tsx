import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { parseUnits, formatUnits } from 'viem';
import PersonalFundFactoryArtifact from '@/abis/PersonalFundFactory.json';
import type { RetirementPlan } from '@/types/retirement_types';
import type { Abi } from 'viem';
import { parseContractError, formatErrorForUI } from '@/utils/contractErrorParser';
import {
  calculateInitialDepositBreakdown,
  formatDepositBreakdown,
} from '@/utils/feeCalculations';
import { formatUSDC } from '@/hooks/usdc/usdcUtils';

const PersonalFundFactoryABI = PersonalFundFactoryArtifact as Abi;
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

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  421614: '0x53E691B568B87f0124bb3A88C8b9958bF8396E81', // Arbitrum Sepolia
  80002: '0x53E691B568B87f0124bb3A88C8b9958bF8396E81',  // Polygon Amoy
};

interface ExecutionStepProps {
  plan: RetirementPlan;
  factoryAddress: `0x${string}`;
  needsApproval: boolean;
  onSuccess: (txHash: string, fundAddress?: string) => void;
}

type TransactionStep =
  | 'idle'
  | 'preparing'
  | 'approving'
  | 'approved'
  | 'creating'
  | 'confirming'
  | 'success'
  | 'error';

interface ErrorDisplay {
  title: string;
  message: string;
  details?: string;
  suggestions?: string[];
  isGasRelated?: boolean;
}

export function ExecutionStep({
  plan,
  factoryAddress,
  needsApproval,
  onSuccess,
}: ExecutionStepProps) {
  const { address: account, chain } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | undefined>();
  const [currentFees, setCurrentFees] = useState<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  } | null>(null);

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const chainId = chain?.id ?? 421614;
  const usdcAddress = USDC_ADDRESSES[chainId];
  const explorerUrl =
    chainId === 421614 ? 'https://sepolia.arbiscan.io' : 'https://amoy.polygonscan.com';

  const parseUSDC = (value: string | number) =>
    parseUnits(typeof value === 'string' ? value : value.toString(), 6);
  const principalWei = parseUSDC(plan.principal);
  const monthlyDepositWei = parseUSDC(plan.monthlyDeposit);
  const amountToApprove = principalWei + monthlyDepositWei;
  const depositBreakdown = calculateInitialDepositBreakdown(principalWei, monthlyDepositWei);
  const formattedBreakdown = formatDepositBreakdown(depositBreakdown, formatUSDC);
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({ hash: approvalHash });
  const {
    writeContract: writeCreateFund,
    data: txHash,
    isPending: isCreatePending,
    error: createError,
    reset: resetCreate,
  } = useWriteContract();

  const {
    isLoading: isTxConfirming,
    isSuccess: isTxSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const fetchCurrentGasFees = useCallback(async () => {
    if (!publicClient) return;
    try {
      const fees = await publicClient.estimateFeesPerGas();
      setCurrentFees({
        maxFeePerGas: fees.maxFeePerGas
          ? (fees.maxFeePerGas * 130n) / 100n 
          : 30000000n, 
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas
          ? fees.maxPriorityFeePerGas + 2000000000n 
          : 2000000000n,
      });
    } catch {
      setCurrentFees({
        maxFeePerGas: 30000000n,
        maxPriorityFeePerGas: 3000000000n,
      });
    }
  }, [publicClient]);

  const estimateCreateFundGas = useCallback(async () => {
    if (!publicClient || !account) return;
    try {
      const gas = await publicClient.estimateContractGas({
        address: factoryAddress,
        abi: PersonalFundFactoryABI,
        functionName: 'createPersonalFund',
        args: [
          principalWei,
          monthlyDepositWei,
          plan.currentAge,
          plan.retirementAge,
          parseUSDC(plan.desiredMonthlyIncome),
          plan.yearsPayments,
          plan.interestRate,
          plan.timelockYears,
        ],
        account,
      });
      setEstimatedGas((gas * 140n) / 100n); 
    } catch {
      setEstimatedGas(3500000n);
    }
  }, [publicClient, account, factoryAddress, principalWei, monthlyDepositWei, plan]);

  useEffect(() => {
    fetchCurrentGasFees();
    const interval = setInterval(fetchCurrentGasFees, 12000);
    return () => clearInterval(interval);
  }, [fetchCurrentGasFees]);

  useEffect(() => {
    if (step === 'idle' || step === 'approved') {
      estimateCreateFundGas();
    }
  }, [step, estimateCreateFundGas]);

  const executeApproval = () => {
    if (!currentFees || !account || !chain) return;
    setStep('approving');
    const request = {
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [factoryAddress, amountToApprove],
      gas: estimatedGas ? estimatedGas / 2n : 150000n,
      maxFeePerGas: currentFees.maxFeePerGas,
      maxPriorityFeePerGas: currentFees.maxPriorityFeePerGas,
      account,
      chain,
    } as const;

    writeApproval(request);
  };

  const executeCreateFund = () => {
    if (!currentFees || !account || !chain) return;
    setStep('creating');

    const request = {
      address: factoryAddress,
      abi: PersonalFundFactoryABI,
      functionName: 'createPersonalFund',
      args: [
        principalWei,
        monthlyDepositWei,
        plan.currentAge,
        plan.retirementAge,
        parseUSDC(plan.desiredMonthlyIncome),
        plan.yearsPayments,
        plan.interestRate,
        plan.timelockYears,
      ],
      gas: estimatedGas,
      maxFeePerGas: currentFees.maxFeePerGas,
      maxPriorityFeePerGas: currentFees.maxPriorityFeePerGas,
      account,
      chain,
    } as const;

    writeCreateFund(request);
  };

  const handleStart = () => {
    setErrorDisplay(null);
    if (!account || !chain || !currentFees) {
      setErrorDisplay({
        title: 'No se puede continuar',
        message: !account ? 'Conecta tu wallet' : 'No se obtuvieron parámetros de gas',
      });
      setStep('error');
      return;
    }

    setStep('preparing');
    if (needsApproval) {
      executeApproval();
    } else {
      executeCreateFund();
    }
  };

  const handleRetry = () => {
    setErrorDisplay(null);
    setStep('idle');
    fetchCurrentGasFees();
  };

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      setStep('approved');
      if (!needsApproval) return;
      setTimeout(executeCreateFund, 1000);
    }
  }, [isApprovalSuccess, approvalHash, step]);

  useEffect(() => {
    if (step === 'approved' && needsApproval) {
      executeCreateFund();
    }
  }, [step]);

  useEffect(() => {
    if ((approvalError && step === 'approving') || (createError && ['creating', 'approved'].includes(step))) {
      const err = approvalError || createError;
      const formatted = formatErrorForUI(err!);
      const isGasError =
        formatted.message?.toLowerCase().includes('max fee') ||
        formatted.message?.toLowerCase().includes('base fee');

      setErrorDisplay({ ...formatted, isGasRelated: isGasError });
      setStep('error');
    }
  }, [approvalError, createError, step]);

  useEffect(() => {
    if (isTxSuccess && receipt && step === 'confirming') {
      let fundAddress: string | undefined;
      try {
        const fundLog = receipt.logs.find((log: any) => log.topics?.length > 1);
        if (fundLog?.topics?.[1]) {
          fundAddress = `0x${fundLog.topics[1].slice(-40)}`;
        }
      } catch {}

      setStep('success');
      onSuccessRef.current(txHash!, fundAddress);
    }
  }, [isTxSuccess, receipt, step, txHash]);

  const isGasError = errorDisplay?.isGasRelated ?? false;

  return (
    <div className="space-y-6">
      {/* Estado visual de los pasos */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {needsApproval ? 'Paso 1 de 2: Aprobación y Creación' : 'Creando tu fondo'}
          </h3>
          {currentFees && (
            <div className="text-sm text-gray-500">
              Max fee: {formatUnits(currentFees.maxFeePerGas, 9)} gwei
            </div>
          )}
        </div>

        <div className="space-y-4">
          {needsApproval && (
            <div className={`p-4 rounded-xl border-2 ${step === 'approved' || step === 'creating' || step === 'confirming' || step === 'success' ? 'bg-green-50 border-green-200' : step === 'approving' ? 'bg-blue-50 border-blue-200 animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {step === 'approved' || step === 'creating' || step === 'confirming' || step === 'success' ? <CheckCircle className="text-green-600" size={24} /> : step === 'approving' ? <Loader2 className="animate-spin text-blue-600" size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-gray-400" />}
                <div>
                  <p className="font-semibold">Aprobar USDC ({formattedBreakdown.grossAmount})</p>
                  {approvalHash && (
                    <a href={`${explorerUrl}/tx/${approvalHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                      Ver transacción <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`p-4 rounded-xl border-2 ${step === 'success' ? 'bg-green-50 border-green-200' : ['creating', 'confirming'].includes(step) ? 'bg-blue-50 border-blue-200 animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              {step === 'success' ? <CheckCircle className="text-green-600" size={24} /> : ['creating', 'confirming'].includes(step) ? <Loader2 className="animate-spin text-blue-600" size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-gray-400" />}
              <div>
                <p className="font-semibold">{needsApproval ? 'Paso 2 de 2' : 'Paso único'}: Crear Fondo Personal</p>
                {txHash && (
                  <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                    Ver transacción <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {errorDisplay && (
        <div className={`p-5 rounded-2xl border ${isGasError ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={isGasError ? 'text-amber-600' : 'text-red-600'} size={24} />
            <div>
              <h4 className="font-bold text-lg">{errorDisplay.title}</h4>
              <p className="text-gray-700 mt-1">{errorDisplay.message}</p>
              {isGasError && (
                <p className="text-sm text-amber-800 mt-2">
                  El precio del gas subió. Haz click en "Reintentar" para usar valores actualizados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      {step === 'idle' && !errorDisplay && (
        <button
          onClick={handleStart}
          disabled={isApprovalPending || isCreatePending || !currentFees}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl py-5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
        >
          {isApprovalPending || isCreatePending ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Procesando...
            </>
          ) : (
            'Iniciar Creación del Fondo'
          )}
        </button>
      )}

      {step === 'error' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleRetry}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md"
          >
            <RefreshCw size={20} />
            Reintentar con gas actualizado
          </button>
          <button
            onClick={() => {
              resetApproval();
              resetCreate();
              setStep('idle');
              setErrorDisplay(null);
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl"
          >
            Cancelar
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-green-800">¡Fondo creado con éxito!</h3>
          <p className="text-green-700 mt-3">Redirigiendo al dashboard...</p>
        </div>
      )}

      {['approving', 'creating', 'confirming'].includes(step) && !errorDisplay && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={36} />
          <p className="text-lg font-semibold text-blue-800">
            {step === 'approving' && 'Confirmando aprobación en tu wallet...'}
            {step === 'creating' && 'Confirmando creación del fondo...'}
            {step === 'confirming' && 'Esperando confirmación en la blockchain...'}
          </p>
          <p className="text-sm text-blue-600 mt-2">No cierres esta ventana</p>
        </div>
      )}
    </div>
  );
}