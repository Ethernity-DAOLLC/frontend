import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
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
  const publicClient = usePublicClient();
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

  // ✅ NUEVA FUNCIÓN: Calcular gas fees dinámicamente
  const getFreshGasFees = useCallback(async () => {
    if (!publicClient) {
      console.warn('⚠️ PublicClient no disponible, usando fallback');
      return {
        maxFeePerGas: 2000000000n,  // 2 Gwei
        maxPriorityFeePerGas: 1000000000n, // 1 Gwei
      };
    }

    try {
      const block = await publicClient.getBlock({ includeTransactions: false });
      const baseFee = block.baseFeePerGas || 100000000n;

      let priorityFee = await publicClient.estimateMaxPriorityFeePerGas();
      const minPriority = 100000000n; // 0.1 Gwei mínimo
      const maxPriorityRelative = baseFee / 2n;
      
      priorityFee = priorityFee > maxPriorityRelative ? maxPriorityRelative : priorityFee;
      priorityFee = priorityFee < minPriority ? minPriority : priorityFee;
      
      // Buffer agresivo del 100%
      let maxFee = baseFee + priorityFee;
      maxFee = (maxFee * 200n) / 100n;
      
      // Mínimo absoluto: doble del baseFee
      const minMaxFee = baseFee * 2n;
      if (maxFee < minMaxFee) {
        maxFee = minMaxFee;
        priorityFee = (maxFee - baseFee) / 2n;
      }

      // Validación final
      if (priorityFee > maxFee - baseFee) {
        priorityFee = (maxFee - baseFee) / 2n;
      }

      console.log('🔧 [useUSDCApproval] Gas Fees:', {
        baseFeeGwei: Number(baseFee) / 1e9,
        maxFeeGwei: Number(maxFee) / 1e9,
        priorityFeeGwei: Number(priorityFee) / 1e9,
      });

      return { maxFeePerGas: maxFee, maxPriorityFeePerGas: priorityFee };
    } catch (error) {
      console.error('❌ Error estimando gas fees:', error);
      return {
        maxFeePerGas: 2000000000n,
        maxPriorityFeePerGas: 1000000000n,
      };
    }
  }, [publicClient]);

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
      
      // ✅ Simular transacción si es posible
      if (publicClient) {
        try {
          await publicClient.simulateContract({
            address: usdcAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender, amountWei],
            account: address,
          });
          console.log('✅ Simulation successful');
        } catch (simulationError: any) {
          console.error('❌ Simulation failed:', simulationError);
          let errorMessage = 'Transaction simulation failed';
          
          if (simulationError.message?.includes('insufficient funds')) {
            errorMessage = 'Insufficient ETH for gas fees. Please add ETH to your wallet.';
          } else if (simulationError.message?.includes('Cannot approve zero address')) {
            errorMessage = 'Invalid spender address (zero address)';
          } else if (simulationError.shortMessage) {
            errorMessage = `Contract error: ${simulationError.shortMessage}`;
          }
          
          const err = new Error(errorMessage);
          setError(err);
          onError?.(err);
          throw err;
        }
      }

      // ✅ Obtener gas fees frescos
      const fees = await getFreshGasFees();

      // ✅ Ejecutar con gas fees dinámicos
      writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amountWei],
        gas: 500000n,
        maxFeePerGas: fees.maxFeePerGas,           // ✅ AGREGADO
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas, // ✅ AGREGADO
      } as any);
      
    } catch (err) {
      console.error('❌ Approval error:', err);
      const error = err as Error;

      if (!error.message?.includes('simulation failed')) {
        let enhancedMessage = error.message;
        if (error.message?.includes('Internal JSON-RPC error')) {
          enhancedMessage = 
            'RPC Error. Possible causes:\n\n' +
            '1. Insufficient ETH for gas (most common)\n' +
            '2. RPC node timeout or overload\n' +
            '3. Network congestion';
        } else if (error.message?.includes('insufficient funds')) {
          enhancedMessage = 'Insufficient ETH for gas fees. Get ETH from faucet.';
        } else if (error.message?.includes('User rejected')) {
          enhancedMessage = 'Transaction rejected by user';
        }
        const enhancedError = new Error(enhancedMessage);
        setError(enhancedError);
        onError?.(enhancedError);
      }
      
      throw error;
    }
  }, [address, usdcAddress, amount, spender, writeContract, publicClient, getFreshGasFees, onError]);

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
    });
    setError(null);

    try {
      if (publicClient) {
        try {
          await publicClient.simulateContract({
            address: usdcAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender, MAX_UINT256],
            account: address,
          });
        } catch (simulationError: any) {
          console.error('❌ Max approval simulation failed:', simulationError);
          
          let errorMessage = 'Transaction simulation failed';
          if (simulationError.message?.includes('insufficient funds')) {
            errorMessage = 'Insufficient ETH for gas fees';
          }
          
          const err = new Error(errorMessage);
          setError(err);
          onError?.(err);
          throw err;
        }
      }

      // ✅ Obtener gas fees frescos
      const fees = await getFreshGasFees();

      // ✅ Ejecutar con gas fees dinámicos
      writeContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, MAX_UINT256],
        gas: 500000n,
        maxFeePerGas: fees.maxFeePerGas,           // ✅ AGREGADO
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas, // ✅ AGREGADO
      } as any);

    } catch (err) {
      console.error('❌ Approval error:', err);
      const error = err as Error;
      
      if (!error.message?.includes('simulation failed')) {
        let enhancedMessage = error.message;
        if (error.message?.includes('Internal JSON-RPC error')) {
          enhancedMessage = 'RPC Error. Check ETH balance and try again.';
        }
        const enhancedError = new Error(enhancedMessage);
        setError(enhancedError);
        onError?.(enhancedError);
      }
      throw error;
    }
  }, [address, usdcAddress, spender, writeContract, publicClient, getFreshGasFees, onError]);

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
      
      let enhancedMessage = error.message;
      
      if (error.message?.includes('Internal JSON-RPC error')) {
        enhancedMessage = 
          '🔴 RPC Error\n\n' +
          'Most common cause: Insufficient ETH for gas\n\n' +
          'Quick fixes:\n' +
          '1. Check your ETH balance\n' +
          '2. Get ETH from: faucet.quicknode.com/arbitrum/sepolia\n' +
          '3. Wait 30s and retry';
      } else if (error.message?.includes('User rejected')) {
        enhancedMessage = 'Transaction cancelled by user';
      }
      const enhancedError = new Error(enhancedMessage);
      setError(enhancedError);
      onError?.(enhancedError);
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