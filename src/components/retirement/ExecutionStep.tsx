import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { parseUnits } from 'viem';
import PersonalFundFactoryArtifact from '@/abis/PersonalFundFactory.json';
import type { RetirementPlan } from '@/types/retirement_types';
import type { Abi } from 'viem';
import { parseContractError, formatErrorForUI } from '@/utils/contractErrorParser';
import { 
  calculateInitialDepositBreakdown, 
  formatDepositBreakdown,
  type InitialDepositBreakdown 
} from '@/utils/feeCalculations';
import { formatUSDC } from '@/hooks/usdc/usdcUtils';

const PersonalFundFactoryABI = (PersonalFundFactoryArtifact as any).abi as Abi;
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
}

export function ExecutionStep({ 
  plan, 
  factoryAddress, 
  needsApproval, 
  onSuccess 
}: ExecutionStepProps) {
  const { address: account, chain } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | undefined>();
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });
  
  const chainId = chain?.id ?? 421614;
  const usdcAddress = USDC_ADDRESSES[chainId];
  const explorerUrl = chainId === 421614 
    ? 'https://sepolia.arbiscan.io'
    : 'https://amoy.polygonscan.com';

  const parseUSDC = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return parseUnits(num.toString(), 6);
  };

  const principalWei = parseUSDC(plan.principal);
  const monthlyDepositWei = parseUSDC(plan.monthlyDeposit);
  const amountToApprove = principalWei + monthlyDepositWei;
  const depositBreakdown = calculateInitialDepositBreakdown(
    principalWei,
    monthlyDepositWei
  );
  const formattedBreakdown = formatDepositBreakdown(depositBreakdown, formatUSDC);
  const { 
    writeContract: writeApproval, 
    data: approvalHash, 
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
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
    error: createError,
    reset: resetCreate,
  } = useWriteContract();

  const { 
    isLoading: isTxConfirming, 
    isSuccess: isTxSuccess,
    data: receipt,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isStep = <T extends TransactionStep>(
    s: TransactionStep, 
    expected: T
  ): s is T => s === expected;

  const estimateCreateFundGas = useCallback(async () => {
    if (!publicClient || !account) return;
    
    try {
      console.log('⛽ Estimating gas for createPersonalFund...');
      
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

      const gasWithBuffer = (gas * 130n) / 100n;
      setEstimatedGas(gasWithBuffer);
      console.log('✅ Gas estimado:', {
        base: gas.toString(),
        withBuffer: gasWithBuffer.toString(),
      });
    } catch (err) {
      console.warn('⚠️ No se pudo estimar gas:', err);
      setEstimatedGas(2500000n); 
    }
  }, [publicClient, account, factoryAddress, principalWei, monthlyDepositWei, plan]);

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && isStep(step, 'approving')) {
      console.log('✅ Approval confirmed:', approvalHash);
      setStep('approved');
    }
  }, [isApprovalSuccess, approvalHash, step]);

  useEffect(() => {
    if (approvalError && isStep(step, 'approving')) {
      const formatted = formatErrorForUI(approvalError);
      setErrorDisplay(formatted);
      setStep('error');
      console.error('🔴 Approval Error:', formatted);
    }
  }, [approvalError, step]);

  useEffect(() => {
    if (createError && (isStep(step, 'creating') || isStep(step, 'approved'))) {
      const formatted = formatErrorForUI(createError);
      setErrorDisplay(formatted);
      setStep('error');
      console.error('🔴 Create Error:', formatted);
    }
  }, [createError, step]);

  useEffect(() => {
    if (receiptError && isStep(step, 'confirming')) {
      const formatted = formatErrorForUI(receiptError);
      setErrorDisplay(formatted);
      setStep('error');
      console.error('🔴 Receipt Error:', formatted);
    }
  }, [receiptError, step]);

  useEffect(() => {
    if (isTxSuccess && receipt && isStep(step, 'confirming')) {
      if (!Array.isArray(receipt?.logs) || receipt.logs.length === 0) {
        const errorMsg = {
          title: 'Error de Receipt',
          message: 'No se encontraron eventos en la transacción',
          details: 'El contrato se creó pero no se emitió el evento FundCreated',
          suggestions: [
            'Verifica en el explorador de bloques si el contrato se creó',
            'Intenta recargar la página y buscar tu fondo en el Dashboard',
          ],
        };
        setErrorDisplay(errorMsg);
        setStep('error');
        console.error('Receipt logs inválidos:', receipt?.logs);
        return;
      }

      console.log('✅ Fondo creado exitosamente!', receipt);
      setStep('success');

      let fundAddress: string | undefined;
      try {
        const fundCreatedLog = receipt.logs.find((log: any) => 
          log.topics && log.topics.length > 0
        );
        if (fundCreatedLog && fundCreatedLog.topics[1]) {
          fundAddress = `0x${fundCreatedLog.topics[1].slice(26)}`;
          console.log('🔍 Fund address extracted:', fundAddress);
        }
      } catch (err) {
        console.warn('⚠️ Could not extract fund address from logs:', err);
      }
      
      onSuccessRef.current(txHash as string, fundAddress);
    }
  }, [isTxSuccess, receipt, step, txHash]);

  const handleStart = async () => {
    setErrorDisplay(null);

    if (!account || !chain) {
      setErrorDisplay({
        title: 'Wallet no conectada',
        message: 'Por favor conecta tu wallet para continuar',
        suggestions: ['Conecta tu wallet usando el botón de la barra superior'],
      });
      setStep('error');
      return;
    }

    if (!usdcAddress) {
      setErrorDisplay({
        title: 'Red no soportada',
        message: `USDC no está disponible en la red ${chain.id}`,
        suggestions: ['Cambia a Arbitrum Sepolia o Polygon Amoy'],
      });
      setStep('error');
      return;
    }

    console.log('🔍 Starting fund creation with amounts:', {
      usdcAddress,
      factoryAddress,
      principal: principalWei.toString(),
      principalUSDC: formatUSDC(principalWei),
      monthlyDeposit: monthlyDepositWei.toString(),
      monthlyDepositUSDC: formatUSDC(monthlyDepositWei),
      totalInitialDeposit: depositBreakdown.grossAmount.toString(),
      totalInitialDepositUSDC: formatUSDC(depositBreakdown.grossAmount),
      amountToApprove: amountToApprove.toString(),
      amountToApproveUSDC: formatUSDC(amountToApprove),
      hasPrincipal: depositBreakdown.hasPrincipal,
      breakdown: formattedBreakdown,
      account,
      chainId: chain.id
    });

    await estimateCreateFundGas();

    if (needsApproval) {
      setStep('approving');
      writeApproval({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress, amountToApprove],
        account,
        chain,
        gas: 100000n,
        maxFeePerGas: 100000000n, 
        maxPriorityFeePerGas: 10000000n, 
      });
    } else {
      handleCreateFund();
    }
  };

  const handleCreateFund = async () => {
    if (!account || !chain) {
      setErrorDisplay({
        title: 'Wallet no conectada',
        message: 'La wallet se desconectó durante el proceso',
        suggestions: ['Reconecta tu wallet e intenta nuevamente'],
      });
      setStep('error');
      return;
    }

    setStep('creating');
    
    console.log('🗂️ Creating fund with params:', {
      principal: principalWei.toString(),
      principalUSDC: formatUSDC(principalWei),
      monthlyDeposit: monthlyDepositWei.toString(),
      monthlyDepositUSDC: formatUSDC(monthlyDepositWei),
      currentAge: plan.currentAge,
      retirementAge: plan.retirementAge,
      desiredMonthlyIncome: parseUSDC(plan.desiredMonthlyIncome).toString(),
      desiredMonthlyIncomeUSDC: formatUSDC(parseUSDC(plan.desiredMonthlyIncome)),
      yearsPayments: plan.yearsPayments,
      interestRate: plan.interestRate,
      timelockYears: plan.timelockYears,
    });

    writeCreateFund({
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
      chain,
      gas: estimatedGas || 2500000n,
      maxFeePerGas: 100000000n, 
      maxPriorityFeePerGas: 10000000n, 
    });
  };

  const reset = () => {
    setStep('idle');
    setErrorDisplay(null);
    setEstimatedGas(undefined);
    resetApproval();
    resetCreate();
  };

  return (
    <div className="space-y-6">
      {isStep(step, 'approved') && (
        <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-bold text-amber-800 mb-2">
                ✅ Aprobación Completada
              </h3>
              <p className="text-amber-700 mb-3">
                Ahora procederemos a crear tu contrato de retiro
              </p>

              <div className="bg-amber-100 rounded-lg p-3 mb-4 text-sm">
                <p className="font-semibold text-amber-900 mb-2">Resumen del depósito inicial:</p>
                <div className="space-y-1 text-amber-800">
                  <div className="flex justify-between">
                    <span>Aporte inicial (principal):</span>
                    <strong>{formatUSDC(principalWei)} USDC</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Primer mes (monthly deposit):</span>
                    <strong>{formatUSDC(monthlyDepositWei)} USDC</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-amber-300 font-bold">
                    <span>Total a aprobar:</span>
                    <strong>{formattedBreakdown.grossAmount} USDC</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee DAO (3%):</span>
                    <strong className="text-orange-700">-{formattedBreakdown.feeAmount} USDC</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-amber-300">
                    <span>Neto a tu fondo:</span>
                    <strong className="text-green-700">{formattedBreakdown.netAmount} USDC</strong>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCreateFund}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Crear Contrato Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {errorDisplay && (
        <div className="bg-red-100 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">{errorDisplay.title}</h3>
              <p className="text-red-700 mb-3">{errorDisplay.message}</p>
              
              {errorDisplay.details && (
                <details className="text-xs text-red-600 mb-3">
                  <summary className="cursor-pointer font-semibold hover:text-red-800">
                    Detalles técnicos
                  </summary>
                  <p className="mt-2 font-mono bg-red-50 p-2 rounded whitespace-pre-wrap">
                    {errorDisplay.details}
                  </p>
                </details>
              )}
              
              {errorDisplay.suggestions && errorDisplay.suggestions.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 mt-3">
                  <p className="text-sm font-semibold text-red-800 mb-2">💡 Sugerencias:</p>
                  <ul className="space-y-1 text-sm text-red-700">
                    {errorDisplay.suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <a
              href={`${explorerUrl}/address/${factoryAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink size={16} />
              Verificar Factory en Explorer
            </a>
            <a
              href={`${explorerUrl}/address/${usdcAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink size={16} />
              Verificar USDC en Explorer
            </a>
            <button
              onClick={reset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-2 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {step !== 'idle' && !isStep(step, 'approved') && !errorDisplay && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            Ejecutando transacciones...
          </h3>

          <div className="space-y-3">
            {needsApproval && (
              <div className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                isStep(step, 'approved') || isStep(step, 'creating') || isStep(step, 'confirming') || isStep(step, 'success')
                  ? 'bg-green-100 border-2 border-green-300' 
                  : isStep(step, 'approving')
                  ? 'bg-blue-100 border-2 border-blue-300'
                  : 'bg-gray-100 border-2 border-gray-200'
              }`}>
                {isStep(step, 'approved') || isStep(step, 'creating') || isStep(step, 'confirming') || isStep(step, 'success') ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
                ) : isStep(step, 'approving') ? (
                  <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={28} />
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-lg">Paso 1: Aprobar USDC</p>
                  <p className="text-sm text-gray-600">
                    Aprobando {formattedBreakdown.grossAmount} USDC
                    {principalWei > 0n && monthlyDepositWei > 0n && (
                      <span className="block text-xs mt-1">
                        ({formatUSDC(principalWei)} inicial + {formatUSDC(monthlyDepositWei)} 1er mes)
                      </span>
                    )}
                  </p>
                  {approvalHash && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-600 font-mono">
                        {approvalHash.slice(0, 10)}...{approvalHash.slice(-8)}
                      </p>
                      <a
                        href={`${explorerUrl}/tx/${approvalHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
              isStep(step, 'success')
                ? 'bg-green-100 border-2 border-green-300'
                : isStep(step, 'creating') || isStep(step, 'confirming')
                ? 'bg-blue-100 border-2 border-blue-300'
                : 'bg-gray-100 border-2 border-gray-200'
            }`}>
              {isStep(step, 'success') ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={28} />
              ) : isStep(step, 'creating') || isStep(step, 'confirming') ? (
                <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={28} />
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  Paso {needsApproval ? '2' : '1'}: Crear Contrato
                </p>
                <p className="text-sm text-gray-600">
                  Creando tu fondo personal de retiro
                </p>
                {txHash && (
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-gray-600 font-mono">
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Info className="text-blue-600 flex-shrink-0" size={20} />
              <p className="text-sm text-blue-800">
                {isStep(step, 'approving') && '⏳ Confirma la aprobación en tu wallet'}
                {isStep(step, 'creating') && '⏳ Confirma la transacción en tu wallet'}
                {isStep(step, 'confirming') && '⏳ Esperando confirmación en la blockchain...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isStep(step, 'idle') && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Listo para crear tu contrato
          </h3>

          <div className="bg-white rounded-xl p-4 mb-6 border border-purple-200">
            <p className="font-semibold text-gray-700 mb-3">Resumen del depósito inicial:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Aporte inicial (principal):</span>
                <strong className="text-gray-900">{formatUSDC(principalWei)} USDC</strong>
              </div>
              <div className="flex justify-between">
                <span>Primer mes (monthly deposit):</span>
                <strong className="text-gray-900">{formatUSDC(monthlyDepositWei)} USDC</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                <span>Total inicial:</span>
                <strong className="text-gray-900 text-base">{formattedBreakdown.grossAmount} USDC</strong>
              </div>
              <div className="flex justify-between text-orange-600">
                <span>Fee DAO (3%):</span>
                <strong>-{formattedBreakdown.feeAmount} USDC</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span>Neto a tu fondo:</span>
                <strong className="text-green-600 text-base">{formattedBreakdown.netAmount} USDC</strong>
              </div>
            </div>
            
            {principalWei === 0n && (
              <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700">
                  💡 <strong>Sin aporte inicial</strong> - Eres joven, tienes tiempo para ahorrar gradualmente
                </p>
              </div>
            )}
            
            {principalWei > 0n && (
              <div className="mt-3 bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-700">
                  💡 <strong>Con aporte inicial</strong> - Esto te ayuda a "ponerte al día" con tu objetivo de retiro
                </p>
              </div>
            )}
          </div>
          
          <p className="text-gray-700 mb-6">
            {needsApproval 
              ? 'Se ejecutarán 2 transacciones: aprobación de USDC y creación del contrato.'
              : 'Se ejecutará 1 transacción para crear tu contrato.'}
          </p>
          
          {estimatedGas && (
            <p className="text-xs text-gray-500 mb-4">
              Gas estimado: {estimatedGas.toString()} wei
            </p>
          )}
          
          <button
            onClick={handleStart}
            disabled={isApprovalPending || isCreatePending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl py-5 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isApprovalPending || isCreatePending ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin" size={24} />
                Procesando...
              </span>
            ) : (
              'Iniciar Creación'
            )}
          </button>
        </div>
      )}
    </div>
  );
}