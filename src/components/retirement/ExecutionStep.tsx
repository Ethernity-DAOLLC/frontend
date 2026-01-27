import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { parseUnits } from 'viem';
import PersonalFundFactoryArtifact from '@/abis/PersonalFundFactory.json';
import type { RetirementPlan } from '@/types/retirement_types';
import type { Abi } from 'viem';
import { formatErrorForUI } from '@/utils/contractErrorParser';
import {
  calculateInitialDepositBreakdown,
  formatDepositBreakdown,
} from '@/utils/feeCalculations';
import { formatUSDC } from '@/hooks/usdc/usdcUtils';
import { useWriteContractWithGas } from '@/hooks/gas/useWriteContractWithGas';

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
  isGasRelated?: boolean;
}

export function ExecutionStep({
  plan,
  factoryAddress,
  needsApproval,
  onSuccess,
}: ExecutionStepProps) {
  const { address: account, chain } = useAccount();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay | null>(null);

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

  // ✅ Usar useWriteContractWithGas en lugar de useWriteContract
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
    gasConfig: approvalGasConfig,
  } = useWriteContractWithGas();

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  const {
    writeContract: writeCreateFund,
    data: txHash,
    isPending: isCreatePending,
    error: createError,
    reset: resetCreate,
    gasConfig: createGasConfig,
  } = useWriteContractWithGas();

  const {
    isLoading: isTxConfirming,
    isSuccess: isTxSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const executeApproval = useCallback(async () => {
    if (!account || !chain) return;
    
    console.log('🔐 Iniciando aprobación de USDC...');
    setStep('approving');

    try {
      // ✅ Gas se maneja automáticamente
      writeApproval({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress, amountToApprove],
      });
    } catch (err: any) {
      console.error('❌ Error en aprobación:', err);
      const formatted = formatErrorForUI(err);
      setErrorDisplay(formatted);
      setStep('error');
    }
  }, [account, chain, usdcAddress, factoryAddress, amountToApprove, writeApproval]);

  const executeCreateFund = useCallback(async () => {
    if (!account) return;

    console.log('🚀 Creando fondo personal...');
    setStep('creating');

    try {
      const args = [
        principalWei,
        monthlyDepositWei,
        plan.currentAge,
        plan.retirementAge,
        parseUSDC(plan.desiredMonthlyIncome),
        plan.yearsPayments,
        plan.interestRate,
        plan.timelockYears,
      ];

      console.log('📊 Parámetros del contrato:', {
        principal: (Number(principalWei) / 1e6).toFixed(2),
        monthlyDeposit: (Number(monthlyDepositWei) / 1e6).toFixed(2),
        currentAge: plan.currentAge,
        retirementAge: plan.retirementAge,
        desiredMonthly: (Number(parseUSDC(plan.desiredMonthlyIncome)) / 1e6).toFixed(2),
        yearsPayments: plan.yearsPayments,
        interestRate: plan.interestRate,
        timelockYears: plan.timelockYears,
      });
      writeCreateFund({
        address: factoryAddress,
        abi: PersonalFundFactoryABI,
        functionName: 'createPersonalFund',
        args,
      });
      setStep('confirming');
    } catch (err: any) {
      console.error('❌ Error creando fondo:', err);
      const formatted = formatErrorForUI(err);
      setErrorDisplay(formatted);
      setStep('error');
    }
  }, [
    account,
    factoryAddress,
    principalWei,
    monthlyDepositWei,
    plan,
    writeCreateFund,
  ]);

  const handleStart = () => {
    if (needsApproval) {
      executeApproval();
    } else {
      executeCreateFund();
    }
  };

  const handleRetry = () => {
    setErrorDisplay(null);
    setStep('idle');
    resetApproval();
    resetCreate();
  };

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      console.log('✅ Aprobación confirmada:', approvalHash);
      setStep('approved');
      if (needsApproval) {
        setTimeout(executeCreateFund, 800);
      }
    }
  }, [isApprovalSuccess, approvalHash, step, needsApproval, executeCreateFund]);

  useEffect(() => {
    if ((approvalError || createError) && ['approving', 'creating', 'approved'].includes(step)) {
      const err = approvalError || createError;
      console.error('❌ Error en transacción:', err);
      const formatted = formatErrorForUI(err!);
      const isGasError = formatted.message?.toLowerCase().includes('fee') ||
                         formatted.message?.toLowerCase().includes('gas') ||
                         formatted.message?.toLowerCase().includes('priority') ||
                         formatted.message?.toLowerCase().includes('base fee');

      setErrorDisplay({ ...formatted, isGasRelated: isGasError });
      setStep('error');
    }
  }, [approvalError, createError, step]);

  useEffect(() => {
    if (isTxSuccess && receipt && step === 'confirming') {
      console.log('✅ Transacción confirmada:', receipt);
      let fundAddress: string | undefined;
      try {
        const log = receipt.logs.find((l: any) => l.topics?.length > 1);
        if (log?.topics?.[1]) {
          fundAddress = `0x${log.topics[1].slice(-40)}`;
          console.log('🎯 Fondo creado en:', fundAddress);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo extraer dirección del fondo:', error);
      }
      setStep('success');
      onSuccessRef.current(txHash!, fundAddress);
    }
  }, [isTxSuccess, receipt, txHash, step]);
  
  const isGasError = errorDisplay?.isGasRelated ?? false;
  const currentGasConfig = step === 'approving' ? approvalGasConfig : createGasConfig;
  return (
    <div className="space-y-6 p-4">
      {/* Visualización de pasos */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-6">
          {needsApproval ? '2 transacciones requeridas' : 'Creando tu fondo...'}
        </h3>

        <div className="space-y-5">
          {needsApproval && (
            <div className={`p-4 rounded-xl border-2 transition-all ${
              step === 'approved' || step === 'creating' || step === 'success'
                ? 'bg-green-50 border-green-200'
                : step === 'approving'
                ? 'bg-blue-50 border-blue-200 animate-pulse'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                {step === 'approved' || step === 'creating' || step === 'success' ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : step === 'approving' ? (
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                )}
                <div>
                  <p className="font-semibold">1. Aprobar USDC ({formattedBreakdown.grossAmount})</p>
                  {approvalHash && (
                    <a
                      href={`${explorerUrl}/tx/${approvalHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      Ver en explorer <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`p-4 rounded-xl border-2 transition-all ${
            step === 'success'
              ? 'bg-green-50 border-green-200'
              : step === 'creating' || step === 'confirming'
              ? 'bg-blue-50 border-blue-200 animate-pulse'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              {step === 'success' ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : step === 'creating' || step === 'confirming' ? (
                <Loader2 className="animate-spin text-blue-600" size={24} />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
              )}
              <div>
                <p className="font-semibold">
                  {needsApproval ? '2. Crear Fondo Personal' : 'Crear Fondo Personal'}
                </p>
                {txHash && (
                  <a
                    href={`${explorerUrl}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    Ver en explorer <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {currentGasConfig?.maxFeePerGas && (
          <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold mb-1">⛽ Gas Fees Automáticos:</p>
            <div className="space-y-0.5 font-mono">
              <p>Max Fee: {(Number(currentGasConfig.maxFeePerGas) / 1e9).toFixed(4)} Gwei</p>
              <p>Priority Fee: {(Number(currentGasConfig.maxPriorityFeePerGas || 0n) / 1e9).toFixed(4)} Gwei</p>
            </div>
          </div>
        )}
      </div>

      {errorDisplay && (
        <div className={`p-5 rounded-2xl border ${isGasError ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={isGasError ? 'text-amber-600 mt-1' : 'text-red-600 mt-1'} size={24} />
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">{errorDisplay.title}</h4>
              <p className="text-gray-700">{errorDisplay.message}</p>
              {isGasError && (
                <p className="text-sm text-amber-800 mt-2">
                  💡 El precio del gas cambió. Haz clic en "Reintentar" para usar valores actuales.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'idle' && !errorDisplay && (
        <button
          onClick={handleStart}
          disabled={isApprovalPending || isCreatePending}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg transition-all"
        >
          {isApprovalPending || isCreatePending ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Procesando...
            </>
          ) : (
            'Iniciar Creación'
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
            Reintentar
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
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800">¡Fondo creado exitosamente!</h3>
          <p className="text-green-700 mt-2">Redirigiendo al dashboard...</p>
        </div>
      )}

      {['approving', 'creating', 'confirming'].includes(step) && !errorDisplay && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-lg font-semibold text-blue-800">
            {step === 'approving' && 'Confirmando aprobación en tu wallet...'}
            {step === 'creating' && 'Confirmando creación del fondo...'}
            {step === 'confirming' && 'Esperando confirmación en la blockchain...'}
          </p>
        </div>
      )}
    </div>
  );
}