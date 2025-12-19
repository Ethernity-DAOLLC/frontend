import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { erc20Abi } from 'viem';
import { parseUSDC, useUSDCAddress } from './usdcUtils';

interface UseUSDCApprovalProps {
  amount: string;
  spender: `0x${string}`;
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface UseUSDCApprovalReturn {
  approve: () => Promise<void>;
  approveMax: () => Promise<void>;
  reset: () => void;

  isApproving: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  hash?: `0x${string}`;
  error: Error | null;
}

const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export function useUSDCApproval({
  amount,
  spender,
  onSuccess,
  onError,
}: UseUSDCApprovalProps): UseUSDCApprovalReturn {
  const { address } = useAccount();
  const usdcAddress = useUSDCAddress();
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
    error: txError,
  } = useWaitForTransactionReceipt({ hash });

  const approve = useCallback(async (): Promise<void> => {
    if (!address) {
      const err = new Error('Wallet not connected');
      setError(err);
      onError?.(err);
      throw err;
    }

    if (!usdcAddress) {
      const err = new Error('USDC address not found for this network');
      setError(err);
      onError?.(err);
      throw err;
    }

    if (!amount || parseFloat(amount) <= 0) {
      const err = new Error('Invalid amount');
      setError(err);
      onError?.(err);
      throw err;
    }

    if (!spender || spender === '0x0000000000000000000000000000000000000000') {
      const err = new Error('Invalid spender address');
      setError(err);
      onError?.(err);
      throw err;
    }

    console.log('🔐 Approving USDC...', {
      amount,
      spender: spender.slice(0, 10) + '...',
      from: address.slice(0, 10) + '...',
    });

    setError(null);

    try {
      const amountWei = parseUSDC(amount);
      console.log('💰 Amount in wei:', amountWei.toString());

      writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amountWei],
      } as any);
    } catch (err) {
      console.error('❌ Approval error:', err);
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw err;
    }
  }, [address, usdcAddress, amount, spender, writeContract, onError]);

  const approveMax = useCallback(async (): Promise<void> => {
    if (!address) {
      const err = new Error('Wallet not connected');
      setError(err);
      onError?.(err);
      throw err;
    }

    if (!usdcAddress) {
      const err = new Error('USDC address not found for this network');
      setError(err);
      onError?.(err);
      throw err;
    }

    if (!spender || spender === '0x0000000000000000000000000000000000000000') {
      const err = new Error('Invalid spender address');
      setError(err);
      onError?.(err);
      throw err;
    }

    console.log('🔐 Approving USDC (MAX)...', {
      amount: 'MAX_UINT256',
      spender: spender.slice(0, 10) + '...',
      from: address.slice(0, 10) + '...',
    });

    setError(null);

    try {
      writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, MAX_UINT256],
      } as any);
    } catch (err) {
      console.error('❌ Approval error:', err);
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw err;
    }
  }, [address, usdcAddress, spender, writeContract, onError]);

  const reset = useCallback(() => {
    setError(null);
    resetWrite();
  }, [resetWrite]);

  useEffect(() => {
    if (isSuccess && hash) {
      console.log('✅ USDC approval confirmed!', {
        hash,
        amount,
        spender: spender.slice(0, 10) + '...',
      });

      setError(null);
      onSuccess?.(hash);
    }
  }, [isSuccess, hash, onSuccess, amount, spender]);

  useEffect(() => {
    if (writeError) {
      console.error('❌ Write error:', writeError);
      const error = writeError as Error;
      setError(error);
      onError?.(error);
    }
  }, [writeError, onError]);

  useEffect(() => {
    if (txError) {
      console.error('❌ Transaction error:', txError);
      const error = txError as Error;
      setError(error);
      onError?.(error);
    }
  }, [txError, onError]);

  return {
    approve,
    approveMax,
    reset,

    isApproving: isWritePending,
    isConfirming,
    isSuccess,
    isError: !!error || !!writeError || !!txError,

    hash,
    error: error || (writeError as Error) || (txError as Error) || null,
  };
}