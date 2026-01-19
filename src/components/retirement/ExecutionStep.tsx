import React, { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { parseUnits } from 'viem';
import PersonalFundFactoryArtifact from '@/abis/PersonalFundFactory.json';
import type { RetirementPlan } from '@/types/retirement_types';
import type { Abi } from 'viem';

const PersonalFundFactoryABI = PersonalFundFactoryArtifact.abi as Abi;
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
  421614: '0x58c086c3662f45C76D468063Dc112542732b4562', // Arbitrum Sepolia
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',  // Polygon Amoy
};

interface ExecutionStepProps {
  plan: RetirementPlan;
  factoryAddress: `0x${string}`;
  needsApproval: boolean;
  onSuccess: (txHash: string, fundAddress?: string) => void;
}

type TransactionStep = 'idle' | 'approving' | 'approved' | 'creating' | 'confirming' | 'success' | 'error';

export function ExecutionStep({ plan, factoryAddress, needsApproval, onSuccess }: ExecutionStepProps) {
  const { address: account, chain } = useAccount();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [error, setError] = useState<string>('');
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
  const initialDepositForFactory = principalWei + monthlyDepositWei;
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
    data: receipt,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isStep = <T extends TransactionStep>(s: TransactionStep, expected: T): s is T => s === expected;
  
  useEffect(() => {
    if (isApprovalSuccess && approvalHash && isStep(step, 'approving')) {
      console.log('✅ Approval confirmed:', approvalHash);
      setStep('approved');
    }
  }, [isApprovalSuccess, approvalHash, step]);

  useEffect(() => {
    if (approvalError && isStep(step, 'approving')) {
      const errMsg = (approvalError as any)?.shortMessage || approvalError.message || 'Error desconocido';
      setError(`Aprobación fallida: ${errMsg}`);
      setStep('error');
    }
  }, [approvalError, step]);

  useEffect(() => {
    if (createError && (isStep(step, 'creating') || isStep(step, 'approved'))) {
      const errMsg = (createError as any)?.shortMessage || createError.message || 'Error desconocido';
      setError(`Creación fallida: ${errMsg}`);
      setStep('error');
    }
  }, [createError, step]);

  useEffect(() => {
    if (receiptError && isStep(step, 'confirming')) {
      const errMsg = (receiptError as any)?.shortMessage || receiptError.message || 'Fallo al obtener receipt';
      setError(`Error confirmando: ${errMsg}. Recarga la página e intenta nuevamente.`);
      setStep('error');
    }
  }, [receiptError, step]);

  useEffect(() => {
    if (isTxSuccess && receipt && isStep(step, 'confirming')) {
      if (!Array.isArray(receipt?.logs)) {
        console.error('Receipt logs inválidos:', receipt?.logs);
        setError('Error procesando receipt: logs no válidos. Recarga la página.');
        setStep('error');
        return;
      }

      console.log('✅ Fondo creado exitosamente!', receipt);
      setStep('success');
      onSuccess(txHash as string);
    }
  }, [isTxSuccess, receipt, step, txHash, onSuccess]);

  const handleStart = () => {
    setError('');
    
    if (!account || !chain) {
      setError('No hay cuenta conectada');
      setStep('error');
      return;
    }

    if (!usdcAddress) {
      setError(`USDC no soportado en la red ${chain.id}`);
      setStep('error');
      return;
    }

    console.log('🔍 Starting approval with CORRECTED amounts:', {
      usdcAddress,
      factoryAddress,
      principal: principalWei.toString(),
      monthlyDeposit: monthlyDepositWei.toString(),
      totalForFactory: initialDepositForFactory.toString(),
      account,
      chainId: chain.id
    });

    if (needsApproval) {
      setStep('approving');

      writeApproval({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress, initialDepositForFactory],
        gas: 200000n, 
      });
    } else {
      handleCreateFund();
    }
  };

  const handleCreateFund = () => {
    if (!account || !chain) {
      setError('No hay cuenta conectada');
      setStep('error');
      return;
    }

    setStep('creating');
    console.log('🔍 Creating fund with params:', {
      principal: principalWei.toString(),
      monthlyDeposit: monthlyDepositWei.toString(),
      currentAge: plan.currentAge,
      retirementAge: plan.retirementAge,
      desiredMonthlyIncome: parseUSDC(plan.desiredMonthlyIncome).toString(),
      yearsPayments: plan.yearsPayments,
      interestRate: plan.interestRate,
      timelockYears: plan.timelockYears,
    });

    writeCreateFund({
      address: factoryAddress,
      abi: PersonalFundFactoryABI, 
      functionName: 'createPersonalFund',
      args: [
        principalWei,                              // _principal
        monthlyDepositWei,                         // _monthlyDeposit
        plan.currentAge,                           // _currentAge
        plan.retirementAge,                        // _retirementAge
        parseUSDC(plan.desiredMonthlyIncome),     // _desiredMonthly
        plan.yearsPayments,                        // _yearsPayments
        plan.interestRate,                         // _interestRate
        plan.timelockYears,                        // _timelockYears
      ],
      gas: 3000000n, // Gas limit más alto para crear contrato
    });
  };

  const reset = () => {
    setStep('idle');
    setError('');
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
              <p className="text-amber-700">
                Ahora procederemos a crear tu contrato de retiro
              </p>
              <button
                onClick={handleCreateFund}
                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Crear Contrato Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Box */}
      {error && (
        <div className="bg-red-100 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-2">Error en la transacción</h3>
              <p className="text-red-700 mb-2">{error}</p>
              <details className="text-xs text-red-600 mt-2">
                <summary className="cursor-pointer font-semibold">Posibles causas</summary>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Balance de USDC insuficiente</li>
                  <li>Balance de gas (ETH/POL) insuficiente</li>
                  <li>Aprobación insuficiente para el Factory</li>
                  <li>Parámetros inválidos según configuración del Factory</li>
                  <li>Ya tienes un fondo creado (solo se permite uno por wallet)</li>
                </ul>
              </details>
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
              Verificar Factory en Arbiscan
            </a>
            <a
              href={`${explorerUrl}/address/${usdcAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink size={16} />
              Verificar USDC en Arbiscan
            </a>
            <button
              onClick={reset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-2"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Progreso */}
      {step !== 'idle' && !isStep(step, 'approved') && !error && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            Ejecutando transacciones...
          </h3>

          <div className="space-y-3">
            {needsApproval && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                isStep(step, 'approving') || isStep(step, 'approved') || isStep(step, 'creating') 
                  ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isStep(step, 'approved') || isStep(step, 'creating') || isStep(step, 'success') ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                ) : isStep(step, 'approving') ? (
                  <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={24} />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Paso 1: Aprobar USDC</p>
                  {approvalHash && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600 font-mono">
                        {approvalHash.slice(0, 10)}...{approvalHash.slice(-8)}
                      </p>
                      <a
                        href={`${explorerUrl}/tx/${approvalHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              isStep(step, 'creating') || isStep(step, 'confirming') || isStep(step, 'success') 
                ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {isStep(step, 'success') ? (
                <CheckCircle className="text-blue-600 flex-shrink-0" size={24} />
              ) : isStep(step, 'creating') || isStep(step, 'confirming') ? (
                <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={24} />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  Paso {needsApproval ? '2' : '1'}: Crear Contrato
                </p>
                {txHash && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-600 font-mono">
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 bg-amber-50 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              {isStep(step, 'approving') && '⏳ Confirma la aprobación en tu wallet'}
              {isStep(step, 'creating') && '⏳ Confirma la transacción en tu wallet'}
              {isStep(step, 'confirming') && '⏳ Esperando confirmación en la blockchain...'}
            </p>
          </div>
        </div>
      )}

      {/* Botón de inicio */}
      {isStep(step, 'idle') && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Listo para crear tu contrato
          </h3>
          <p className="text-gray-700 mb-6">
            {needsApproval 
              ? 'Se ejecutarán 2 transacciones: aprobación de USDC y creación del contrato.'
              : 'Se ejecutará 1 transacción para crear tu contrato.'}
          </p>
          
          <button
            onClick={handleStart}
            disabled={isApprovalPending || isCreatePending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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