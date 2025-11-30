import { useState, useEffect } from 'react';
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
  onTransactionSuccess?: () => void;
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

  const executeApproval = async () => {
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
  };

  const executeTransaction = async () => {
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
    });

    setStep('executing');
    setError(null);

    try {
      writeContract(
        {
          address: contractAddress,
          abi,
          functionName,
          args,
        } as any,
        {
          onSuccess: (hash) => {
            console.log('✅ Transaction submitted:', hash);

          },
          onError: (error) => {
            console.error('❌ Transaction error:', error);
            setError(error as Error);
            setStep('idle');
          },
        }
      );
    } catch (err) {
      console.error('❌ Transaction execution failed:', err);
      setError(err as Error);
      setStep('idle');
      throw err;
    }
  };

  const executeAll = async () => {
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
      setError(err as Error);
    }
  };

  useEffect(() => {
    if (step === 'approved' && approval.isSuccess) {
      console.log('✅ Approval confirmed, executing transaction...');
      executeTransaction();
    }
  }, [step, approval.isSuccess]);

  useEffect(() => {
    if (isTxSuccess && step === 'executing') {
      console.log('✅ Transaction confirmed!');
      setStep('success');
      onTransactionSuccess?.();
    }
  }, [isTxSuccess, step]);

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

  const reset = () => {
    setStep('idle');
    setError(null);
    resetWrite();
  };

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