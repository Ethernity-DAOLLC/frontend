import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { useUSDCAllowance } from './useUSDC';
import { useUSDCApproval } from './useUSDCApproval';
import { parseUSDC, needsApproval } from './usdcUtils';

type TransactionStep = 'idle' | 'checking' | 'approving' | 'approved' | 'executing' | 'confirming' | 'success' | 'error';

interface UseUSDCTransactionProps {
  contractAddress: `0x${string}`;
  abi: any;
  functionName: string;
  args?: any[];
  usdcAmount: string;
  onApprovalSuccess?: () => void;
  onTransactionSuccess?: (txHash: `0x${string}`) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  autoExecuteAfterApproval?: boolean;
}

interface UseUSDCTransactionReturn {
  step: TransactionStep;
  requiresApproval: boolean;
  currentAllowance?: bigint;
  error: Error | null;
  executeApproval: () => Promise<void>;
  executeTransaction: () => Promise<void>;
  executeAll: () => Promise<void>;
  refetchAllowance: () => void;
  reset: () => void;
  isApproving: boolean;
  isApprovingConfirming: boolean;
  approvalSuccess: boolean;
  approvalHash?: `0x${string}`;
  isExecuting: boolean;
  isConfirming: boolean;
  txHash?: `0x${string}`;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  progress: number;
}

export function useUSDCTransaction({
  contractAddress,
  abi,
  functionName,
  args = [],
  usdcAmount,
  onApprovalSuccess,
  onTransactionSuccess,
  onError,
  enabled = true,
  autoExecuteAfterApproval = true,
}: UseUSDCTransactionProps): UseUSDCTransactionReturn {
  const { address } = useAccount();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [error, setError] = useState<Error | null>(null);
  const {
    data: currentAllowance,
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useUSDCAllowance(address, contractAddress);

  const requiresApproval = enabled && 
    parseFloat(usdcAmount) > 0 && 
    needsApproval(currentAllowance, parseUSDC(usdcAmount));

  const approval = useUSDCApproval({
    amount: usdcAmount,
    spender: contractAddress,
    onSuccess: (hash) => {
      console.log('✅ Approval successful:', hash);
      setStep('approved');
      refetchAllowance();
      onApprovalSuccess?.();
    },
    onError: (err) => {
      console.error('❌ Approval failed:', err);
      setError(err);
      setStep('error');
      onError?.(err);
    },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isTxConfirming,
    isSuccess: isTxSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const executeApproval = useCallback(async () => {
    if (!requiresApproval) {
      console.warn('⚠️ Approval not required');
      return;
    }

    console.log('🔐 Starting USDC approval...');
    setStep('approving');
    setError(null);

    try {
      await approval.approve();
    } catch (err) {
      console.error('❌ Approval failed:', err);
      const error = err as Error;
      setError(error);
      setStep('error');
      onError?.(error);
      throw err;
    }
  }, [requiresApproval, approval, onError]);
  const executeTransaction = useCallback(async () => {
    if (requiresApproval && step !== 'approved') {
      const err = new Error('Must approve USDC first');
      console.error('❌', err.message);
      setError(err);
      setStep('error');
      onError?.(err);
      throw err;
    }
    console.log('🚀 Executing contract transaction...', {
      contractAddress,
      functionName,
      args,
    });
    setStep('executing');
    setError(null);
    try {
      writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        value: 0n,
      } as any);
      
      setStep('confirming');
    } catch (err) {
      console.error('❌ Transaction execution failed:', err);
      const error = err as Error;
      setError(error);
      setStep('error');
      onError?.(error);
      throw err;
    }
  }, [requiresApproval, step, contractAddress, abi, functionName, args, writeContract, onError]);

  const executeAll = useCallback(async () => {
    setError(null);

    try {
      if (requiresApproval) {
        console.log('📋 Flow: Approval → Transaction');
        await executeApproval();
      } else {
        console.log('📋 Flow: Transaction only (no approval needed)');
        await executeTransaction();
      }
    } catch (err) {
      console.error('❌ executeAll failed:', err);
      const error = err as Error;
      setError(error);
      setStep('error');
      onError?.(error);
    }
  }, [requiresApproval, executeApproval, executeTransaction, onError]);
  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    approval.reset();
    resetWrite();
  }, [approval, resetWrite]);
  useEffect(() => {
    if (autoExecuteAfterApproval && step === 'approved' && approval.isSuccess) {
      console.log('✅ Approval confirmed, executing transaction...');
      executeTransaction();
    }
  }, [autoExecuteAfterApproval, step, approval.isSuccess, executeTransaction]);
  useEffect(() => {
    if (isTxSuccess && txHash) {
      console.log('✅ Transaction confirmed!', txHash);
      setStep('success');
      onTransactionSuccess?.(txHash);
    }
  }, [isTxSuccess, txHash, onTransactionSuccess]);

  useEffect(() => {
    if (writeError) {
      console.error('❌ Write error:', writeError);
      const error = writeError as Error;
      setError(error);
      setStep('error');
      onError?.(error);
    }
  }, [writeError, onError]);
  useEffect(() => {
    if (txError) {
      console.error('❌ Transaction confirmation error:', txError);
      const error = txError as Error;
      setError(error);
      setStep('error');
      onError?.(error);
    }
  }, [txError, onError]);
  const progress = (() => {
    switch (step) {
      case 'idle': return 0;
      case 'checking': return 10;
      case 'approving': return 30;
      case 'approved': return 50;
      case 'executing': return 70;
      case 'confirming': return 85;
      case 'success': return 100;
      case 'error': return 0;
      default: return 0;
    }
  })();
  return {
    step,
    requiresApproval,
    currentAllowance,
    error,
    executeApproval,
    executeTransaction,
    executeAll,
    refetchAllowance,
    reset,
    isApproving: approval.isApproving || step === 'approving',
    isApprovingConfirming: approval.isConfirming,
    approvalSuccess: approval.isSuccess,
    approvalHash: approval.hash,
    isExecuting: isWritePending || step === 'executing',
    isConfirming: isTxConfirming || step === 'confirming',
    txHash,
    isLoading:
      isCheckingAllowance ||
      approval.isApproving ||
      approval.isConfirming ||
      isWritePending ||
      isTxConfirming ||
      ['checking', 'approving', 'executing', 'confirming'].includes(step),
    isSuccess: step === 'success' && isTxSuccess,
    isError: step === 'error' || !!error,
    progress,
  };
}