import { useState, useEffect } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { USDC_ADDRESS, USDC_DECIMALS } from './usdcUtils';

interface Props {
  amount: string;       
  spender: `0x${string}`;  
  onSuccess?: () => void;
}

export function useUSDCApprovalAndTransaction({ amount, spender, onSuccess }: Props) {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { 
    writeContract, 
    data: hash, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess,
    error: txError 
  } = useWaitForTransactionReceipt({ 
    hash,
  });

  const approveAndWait = async (): Promise<void> => {

    if (!address) {
      const error = new Error('Wallet not connected');
      setError(error);
      throw error;
    }

    if (!amount || parseFloat(amount) <= 0) {
      const error = new Error('Invalid amount');
      setError(error);
      throw error;
    }

    if (!spender || spender === '0x0000000000000000000000000000000000000000') {
      const error = new Error('Invalid spender address');
      setError(error);
      throw error;
    }

    console.log('🔐 Starting USDC approval...', {
      amount,
      spender: spender.slice(0, 10) + '...',
      from: address?.slice(0, 10) + '...',
    });

    setIsApproving(true);
    setError(null);

    try {
      const amountWei = parseUnits(amount, USDC_DECIMALS);
      console.log('📝 Amount in wei:', amountWei.toString());

      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amountWei],
      } as any);

      return new Promise<void>((resolve, reject) => {

        (window as any).__approvalResolve = resolve;
        (window as any).__approvalReject = reject;
      });

    } catch (err) {
      console.error('❌ Approval error:', err);
      setError(err as Error);
      setIsApproving(false);
      throw err;
    }
  };

  useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ USDC approval confirmed!', {
        hash,
        amount,
        spender: spender.slice(0, 10) + '...',
      });

      setIsApproving(false);
      setError(null);
      onSuccess?.();

      if ((window as any).__approvalResolve) {
        (window as any).__approvalResolve();
        delete (window as any).__approvalResolve;
        delete (window as any).__approvalReject;
      }
    }
  }, [isSuccess, hash, onSuccess, amount, spender]);

  useEffect(() => {
    if (writeError) {
      console.error('❌ Write error:', writeError);
      setError(writeError as Error);
      setIsApproving(false);

      if ((window as any).__approvalReject) {
        (window as any).__approvalReject(writeError);
        delete (window as any).__approvalResolve;
        delete (window as any).__approvalReject;
      }
    }
  }, [writeError]);

  useEffect(() => {
    if (txError) {
      console.error('❌ Transaction error:', txError);
      setError(txError as Error);
      setIsApproving(false);

      if ((window as any).__approvalReject) {
        (window as any).__approvalReject(txError);
        delete (window as any).__approvalResolve;
        delete (window as any).__approvalReject;
      }
    }
  }, [txError]);

  const reset = () => {
    setIsApproving(false);
    setError(null);
    resetWrite();

    delete (window as any).__approvalResolve;
    delete (window as any).__approvalReject;
  };

  return {

    approveAndWait,

    isApproving: isApproving || isWritePending,
    isConfirming,
    isSuccess,
    hash,

    error: error || writeError || txError,
    isError: !!error || !!writeError || !!txError,
    reset,
  };
}
