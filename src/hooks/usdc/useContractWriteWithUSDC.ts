import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useAccount, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi } from 'viem';
import { USDC_ADDRESS, parseUSDC, needsApproval } from './usdcUtils';
import { useUSDCApprovalAndTransaction } from './useUSDCApprovalAndTransaction';

interface WriteWithUSDCParams {
  contractAddress: `0x${string}`;
  abi: any;
  functionName: string;
  args?: any[];
  usdcAmount: string;
  enabled?: boolean;
  onApprovalSuccess?: () => void;
  onTransactionSuccess?: (txHash: `0x${string}`) => void;
}

export function useContractWriteWithUSDC({
  contractAddress,
  abi,
  functionName,
  args = [],
  usdcAmount,
  enabled = true,
  onApprovalSuccess,
  onTransactionSuccess,
}: WriteWithUSDCParams) {
  const { address } = useAccount();
  const [step, setStep] = useState<'idle' | 'approving' | 'approved' | 'executing' | 'success'>('idle');
  const [error, setError] = useState<Error | null>(null);

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  const approval = useUSDCApprovalAndTransaction({
    amount: usdcAmount,
    spender: contractAddress,
    onSuccess: () => {
      console.log('✅ USDC approval successful');
      setStep('approved');
      refetchAllowance();
      onApprovalSuccess?.();
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
    error: txError 
  } = useWaitForTransactionReceipt({ 
    hash: txHash,
  });

  const requiresApproval = enabled && 
    parseFloat(usdcAmount) > 0 && 
    needsApproval(currentAllowance, parseUSDC(usdcAmount));

  const executeTransaction = useCallback(async () => {
    if (requiresApproval && step !== 'approved') {
      const errorMsg = 'Must approve USDC first';
      console.error('❌', errorMsg);
      setError(new Error(errorMsg));
      throw new Error(errorMsg);
    }

    console.log('🚀 Executing contract transaction...', {
      contractAddress,
      functionName,
      args,
      value: '0 ETH (USDC only)',
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
    } catch (err) {
      console.error('❌ Transaction execution failed:', err);
      setError(err as Error);
      setStep('idle');
      throw err;
    }
  }, [requiresApproval, step, contractAddress, abi, functionName, args, writeContract]);

  const executeApproval = useCallback(async () => {
    if (!requiresApproval) {
      console.warn('⚠️ Approval not required');
      return;
    }

    console.log('🔐 Starting USDC approval...');
    setStep('approving');
    setError(null);

    try {
      await approval.approveAndWait();
    } catch (err) {
      console.error('❌ Approval failed:', err);
      setError(err as Error);
      setStep('idle');
      throw err;
    }
  }, [requiresApproval, approval]);

  const executeAll = useCallback(async () => {
    try {
      if (requiresApproval) {
        console.log('📋 Flow: Approval → Transaction (USDC only, no ETH)');
        await executeApproval();
      } else {
        console.log('📋 Flow: Transaction only (no approval needed)');
        await executeTransaction();
      }
    } catch (err) {
      console.error('❌ executeAll failed:', err);
      setError(err as Error);
    }
  }, [requiresApproval, executeApproval, executeTransaction]);

  useEffect(() => {
    if (step === 'approved' && approval.isSuccess) {
      console.log('✅ Approval confirmed, executing transaction...');
      executeTransaction();
    }
  }, [step, approval.isSuccess, executeTransaction]);

  useEffect(() => {
    if (isTxSuccess && step === 'executing' && txHash) {
      console.log('✅ Transaction confirmed!', txHash);
      setStep('success');
      onTransactionSuccess?.(txHash);
    }
  }, [isTxSuccess, step, txHash, onTransactionSuccess]);

  useEffect(() => {
    if (writeError) {
      console.error('❌ Write error:', writeError);
      setError(writeError as Error);
      setStep('idle');
    }
  }, [writeError]);

  useEffect(() => {
    if (txError) {
      console.error('❌ Transaction confirmation error:', txError);
      setError(txError as Error);
      setStep('idle');
    }
  }, [txError]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    resetWrite();
  }, [resetWrite]);

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
    isConfirming: isTxConfirming,
    txHash: txHash,

    isLoading: 
      approval.isApproving || 
      approval.isConfirming || 
      isWritePending || 
      isTxConfirming ||
      step === 'approving' ||
      step === 'executing',
    
    isSuccess: step === 'success' && isTxSuccess,
  };
}
