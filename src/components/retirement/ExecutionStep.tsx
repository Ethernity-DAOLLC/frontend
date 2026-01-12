import React, { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { parseUnits } from 'viem';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';
import type { RetirementPlan } from '@/types/retirement';

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',  // Polygon Amoy
};

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
  
  const usdcAddress = USDC_ADDRESSES[chainId];
  const explorerUrl = chainId === 421614 
    ? 'https://sepolia.arbiscan.io'
    : 'https://amoy.polygonscan.com';

  const parseUSDC = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return parseUnits(num.toString(), 6);
  };

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
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      console.log('✅ Approval confirmed');
      setStep('approved');
      setTimeout(() => {
        handleCreateFund();
      }, 1500);
    }
  }, [isApprovalSuccess, approvalHash, step]);

  useEffect(() => {
    if (approvalError && step === 'approving') {
      console.error('❌ Approval error:', approvalError);
      setError(`Aprobación fallida: ${(approvalError as any)?.shortMessage || approvalError.message}`);
      setStep('error');
    }
  }, [approvalError, step]);

  useEffect(() => {
    if (createError && (step === 'creating' || step === 'approved')) {
      console.error('❌ Create fund error:', createError);
      setError(`Creación fallida: ${(createError as any)?.shortMessage || createError.message}`);
      setStep('error');
    }
  }, [createError, step]);

  useEffect(() => {
    if (isTxSuccess && txHash && step === 'confirming') {
      console.log('✅ Transaction successful!', receipt);
      setStep('success');

      const fundAddress = '0x...';       
      onSuccess(txHash, fundAddress);
    }
  }, [isTxSuccess, txHash, receipt, step]);

  useEffect(() => {
    if (isTxConfirming && step === 'creating') {
      setStep('confirming');
    }
  }, [isTxConfirming, step]);

  const handleApproveUSDC = async () => {
    if (!usdcAddress) {
      setError('USDC address not configured for this network');
      return;
    }

    setError('');
    setStep('approving');
    
    try {
      console.log('🔐 Approving USDC...');
      const requiredAmount = parseUSDC(plan.initialDeposit);
      
      writeApproval({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [factoryAddress, requiredAmount],
      });
    } catch (err: any) {
      console.error('❌ Error approving USDC:', err);
      setError(err.message || 'Failed to approve USDC');
      setStep('error');
    }
  };

  const handleCreateFund = async () => {
    setStep('creating');
    
    try {
      console.log('🚀 Creating retirement fund contract...');
      
      const args = [
        parseUSDC(plan.initialDeposit),
        parseUSDC(plan.monthlyDeposit),
        BigInt(plan.currentAge),
        BigInt(plan.retirementAge),
        parseUSDC(plan.desiredMonthlyIncome),
        BigInt(plan.yearsPayments),
        BigInt(Math.round(plan.interestRate * 100)),
        BigInt(plan.timelockYears),
      ];

      writeCreateFund({
        address: factoryAddress,
        abi: PersonalFundFactoryABI as any,
        functionName: 'createPersonalFund',
        args,
      });

      console.log('✅ Transaction submitted');
    } catch (err: any) {
      console.error('❌ Error creating contract:', err);
      setError(err.message || 'Failed to create retirement fund contract');
      setStep('error');
    }
  };

  const handleStart = () => {
    if (needsApproval) {
      handleApproveUSDC();
    } else {
      handleCreateFund();
    }
  };

  const getProgressPercentage = () => {
    if (step === 'idle') return 0;
    if (step === 'approving') return needsApproval ? 25 : 50;
    if (step === 'approved') return 50;
    if (step === 'creating') return 75;
    if (step === 'confirming') return 90;
    if (step === 'success') return 100;
    return 0;
  };

  const getStatusMessage = () => {
    switch (step) {
      case 'idle':
        return 'Listo para comenzar';
      case 'approving':
        return 'Aprobando USDC...';
      case 'approved':
        return 'USDC aprobado ✓';
      case 'creating':
        return 'Creando tu fondo...';
      case 'confirming':
        return 'Confirmando transacción...';
      case 'success':
        return '¡Fondo creado exitosamente!';
      case 'error':
        return 'Error en la transacción';
      default:
        return '';
    }
  };

  if (step === 'success' && txHash) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl p-8 text-center shadow-2xl">
        <CheckCircle size={80} className="mx-auto mb-6 animate-bounce" />
        <h3 className="text-4xl font-black mb-4">¡Contrato Creado!</h3>
        <p className="text-xl opacity-90 mb-6">Tu fondo de retiro está ahora en la blockchain</p>
        
        <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-6">
          <p className="text-sm opacity-80 mb-2">Transaction Hash:</p>
          <p className="font-mono text-sm break-all">{txHash}</p>
        </div>

        <a
          href={`${explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-emerald-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition"
        >
          <ExternalLink size={20} />
          Ver en Explorer
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && step === 'error' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 mb-2">Error en la transacción</h4>
              <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
              
              {factoryAddress && (
                <a
                  href={`${explorerUrl}/address/${factoryAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline mt-3"
                >
                  <ExternalLink size={14} />
                  Verificar Factory en Explorer
                </a>
              )}
            </div>
          </div>
          
          <button
            onClick={handleStart}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Progress Display */}
      {step !== 'idle' && step !== 'error' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-800 font-semibold text-lg">
              {getStatusMessage()}
            </span>
            <span className="text-blue-600 font-bold text-xl">
              {getProgressPercentage()}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="space-y-3">
            {needsApproval && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                step === 'approving' || step === 'approved' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {step === 'approved' ? (
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
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
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