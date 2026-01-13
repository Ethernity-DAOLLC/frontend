import React, { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { parseUnits } from 'viem';
import { getContractAddress } from '@/config/addresses'
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';
import type { RetirementPlan } from '@/types/retirement_types';

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

interface ExecutionStepProps {
  plan: RetirementPlan;
  factoryAddress: `0x${string}`;
  needsApproval: boolean;
  onSuccess: (txHash: string, fundAddress?: string) => void;
}

type TransactionStep = 'idle' | 'approving' | 'approved' | 'creating' | 'confirming' | 'success' | 'error';

export function ExecutionStep({ plan, factoryAddress, needsApproval, onSuccess }: ExecutionStepProps) {
  const chainId = useChainId();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [error, setError] = useState<string>('');
  const usdcAddress = getContractAddress(chainId, 'usdc');
  const explorerUrl = chainId === 421614 
    ? 'https://sepolia.arbiscan.io'
    : 'https://amoy.polygonscan.com';

  const parseUSDC = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return parseUnits(num.toString(), 6);
  };

  const initialDepositWei = parseUSDC(plan.initialDeposit);

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
    pollingInterval: 10000, 
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
    pollingInterval: 10000, 
  });

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      console.log('✅ Approval confirmed:', approvalHash);
      setStep('approved');

    }
  }, [isApprovalSuccess, approvalHash, step]);

  useEffect(() => {
    if (approvalError && step === 'approving') {
      console.error('❌ Approval error:', approvalError);
      const errMsg = (approvalError as any)?.shortMessage || approvalError.message || 'Unknown error';
      setError(`Aprobación fallida: ${errMsg}`);
      setStep('error');
    }
  }, [approvalError, step]);

  // Handle create error
  useEffect(() => {
    if (createError && (step === 'creating' || step === 'approved')) {
      console.error('❌ Create fund error:', createError);
      const errMsg = (createError as any)?.shortMessage || createError.message || 'Unknown error';
      setError(`Creación fallida: ${errMsg}`);
      setStep('error');
    }
  }, [createError, step]);

  useEffect(() => {
    if (receiptError && step === 'confirming') {
      console.error('❌ Receipt error:', receiptError);
      const errMsg = (receiptError as any)?.shortMessage || receiptError.message || 'Failed to get transaction receipt';
      setError(`Error confirmando transacción: ${errMsg}. Intenta recargar la página.`);
      setStep('error');
    }
  }, [receiptError, step]);

  useEffect(() => {
    if (isTxSuccess && receipt && step === 'confirming') {
      if (!Array.isArray(receipt.logs)) {
        console.error('❌ Invalid receipt logs:', receipt.logs);
        setError('Error procesando transacción: Logs inválidos. Recarga la página e intenta de nuevo.');
        setStep('error');
        return;
      }

      console.log('✅ Fondo creado exitosamente!', receipt);
      setStep('success');
      onSuccess(txHash as string );
    }
  }, [isTxSuccess, receipt, step, txHash, onSuccess]);

  const handleStart = () => {
    setError('');
    setStep('approving');

    if (needsApproval) {
      writeApproval({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress, initialDepositWei],
      });
    } else {
      handleCreateFund();
    }
  };

  const handleCreateFund = () => {
    setStep('creating');

    writeCreateFund({
      address: factoryAddress,
      abi: PersonalFundFactoryABI,
      functionName: 'createPersonalFund',
      args: [
        parseUSDC(plan.principal),
        parseUSDC(plan.monthlyDeposit),
        plan.currentAge,
        plan.retirementAge,
        parseUSDC(plan.desiredMonthlyIncome),
        plan.yearsPayments,
        plan.interestRate,
        plan.timelockYears,
      ],
    });
  };

  const reset = () => {
    setStep('idle');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-2">Error en la transacción</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <a
              href={`${explorerUrl}/address/${factoryAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink size={16} />
              Verificar Factory en Arbiscan
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

      {/* Reload Message after Approval */}
      {step === 'approved' && (
        <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-bold text-amber-800 mb-2">¡Aprobación exitosa!</h3>
              <p className="text-amber-700">
                La aprobación de USDC se confirmó correctamente.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-amber-900 font-semibold mb-2">
              ⚠️ Para continuar, recarga la página
            </p>
            <p className="text-sm text-amber-800 mb-4">
              Esto asegura una conexión estable con tu wallet antes de crear el contrato.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Recargar ahora
            </button>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {step !== 'idle' && step !== 'approved' && !error && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            Ejecutando transacciones...
          </h3>

          <div className="space-y-3">
            {needsApproval && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                step === 'approving' || step === 'approved' || step === 'creating' 
                  ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {step === 'approved' || step === 'creating' || step === 'success' ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                ) : step === 'approving' ? (
                  <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={24} />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Paso 1: Aprobar USDC</p>
                  {approvalHash && (
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      {approvalHash.slice(0, 10)}...{approvalHash.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              step === 'creating' || step === 'confirming' || step === 'success' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {step === 'success' ? (
                <CheckCircle className="text-blue-600 flex-shrink-0" size={24} />
              ) : (step === 'creating' || step === 'confirming') ? (
                <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={24} />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  Paso {needsApproval ? '2' : '1'}: Crear Contrato
                </p>
                {txHash && (
                  <p className="text-xs text-gray-600 font-mono mt-1">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Waiting messages */}
          <div className="mt-4 bg-amber-50 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              {step === 'approving' && '⏳ Confirma la aprobación en tu wallet'}
              {step === 'approved' && '✓ Preparando creación del contrato...'}
              {step === 'creating' && '⏳ Confirma la transacción en tu wallet'}
              {step === 'confirming' && '⏳ Esperando confirmación en la blockchain...'}
            </p>
          </div>
        </div>
      )}

      {/* Start Button */}
      {step === 'idle' && (
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