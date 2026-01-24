import { useState, useEffect, useCallback, useRef } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useUSDCAllowance } from './useUSDC';
import { useUSDCApproval } from './useUSDCApproval';
import { useUSDCBalance } from './useUSDCBalance';
import { parseUSDC, needsApproval, formatUSDC } from './usdcUtils';
import { 
  calculateTotalRequired, 
  hasEnoughBalanceWithFees,
  calculateShortfall,
  validateDeposit,
  type DepositValidation 
} from '@/utils/feeCalculations';

type TransactionStep = 
  | 'idle' 
  | 'checking' 
  | 'approving' 
  | 'approved' 
  | 'executing' 
  | 'confirming' 
  | 'success' 
  | 'error';

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
  estimateGas?: boolean; 
}

interface UseUSDCTransactionReturn {
  step: TransactionStep;
  requiresApproval: boolean;
  currentAllowance?: bigint;
  userBalance: bigint;
  hasEnoughBalance: boolean;
  validation: DepositValidation | null;
  error: Error | null;

  executeApproval: () => Promise<void>;
  executeTransaction: () => Promise<void>;
  executeAll: () => Promise<void>;
  refetchAllowance: () => void;
  refetchBalance: () => void;
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
  estimatedGas?: bigint;
  totalRequired: bigint; 
  shortfall: bigint; 
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
  estimateGas = true,
}: UseUSDCTransactionProps): UseUSDCTransactionReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<TransactionStep>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | undefined>();
  const [validation, setValidation] = useState<DepositValidation | null>(null);
  const onApprovalSuccessRef = useRef(onApprovalSuccess);
  const onTransactionSuccessRef = useRef(onTransactionSuccess);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onApprovalSuccessRef.current = onApprovalSuccess;
    onTransactionSuccessRef.current = onTransactionSuccess;
    onErrorRef.current = onError;
  });

  const {
    data: userBalance = 0n,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useUSDCBalance(address);

  const {
    data: currentAllowance,
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useUSDCAllowance(address, contractAddress);

  const amountInWei = parseUSDC(usdcAmount);
  const totalRequired = calculateTotalRequired(amountInWei);
  const hasEnoughBalance = hasEnoughBalanceWithFees(userBalance, amountInWei);
  const shortfall = calculateShortfall(userBalance, totalRequired);
  const requiresApproval = enabled && 
    parseFloat(usdcAmount) > 0 && 
    needsApproval(currentAllowance, amountInWei);

  useEffect(() => {
    if (enabled && parseFloat(usdcAmount) > 0) {
      const depositValidation = validateDeposit(
        amountInWei,
        userBalance,
        {
          checkBalance: true,
        }
      );
      setValidation(depositValidation);

      console.log('💰 USDC Transaction Validation:', {
        userBalance: formatUSDC(userBalance),
        required: formatUSDC(amountInWei),
        totalRequired: formatUSDC(totalRequired),
        hasEnough: hasEnoughBalance,
        shortfall: formatUSDC(shortfall),
        currentAllowance: formatUSDC(currentAllowance || 0n),
        requiresApproval,
        validation: depositValidation,
      });
    }
  }, [enabled, usdcAmount, amountInWei, userBalance, totalRequired, hasEnoughBalance, shortfall, currentAllowance, requiresApproval]);

  const approval = useUSDCApproval({
    amount: usdcAmount,
    spender: contractAddress,
    onSuccess: (hash) => {
      console.log('✅ Approval successful:', hash);
      setStep('approved');
      refetchAllowance();
      onApprovalSuccessRef.current?.();
    },
    onError: (err) => {
      console.error('❌ Approval failed:', err);
      setError(err);
      setStep('error');
      onErrorRef.current?.(err);
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

  const estimateTransactionGas = useCallback(async () => {
    if (!estimateGas || !publicClient || !address) return;
    
    try {
      const gas = await publicClient.estimateContractGas({
        address: contractAddress,
        abi,
        functionName,
        args,
        account: address,
      });

      const gasWithBuffer = (gas * 120n) / 100n;
      setEstimatedGas(gasWithBuffer);
      
      console.log('⛽ Gas estimado:', {
        base: gas.toString(),
        withBuffer: gasWithBuffer.toString(),
      });
    } catch (err) {
      console.warn('⚠️ No se pudo estimar gas, usando default');
      setEstimatedGas(undefined);
    }
  }, [estimateGas, publicClient, address, contractAddress, abi, functionName, args]);

  const executeApproval = useCallback(async () => {
    if (!requiresApproval) {
      console.warn('⚠️ Approval not required');
      return;
    }

    if (!hasEnoughBalance) {
      const err = new Error(
        `Insufficient USDC balance.\n\n` +
        `Required: ${formatUSDC(totalRequired)} USDC\n` +
        `Available: ${formatUSDC(userBalance)} USDC\n` +
        `Shortfall: ${formatUSDC(shortfall)} USDC\n\n` +
        `Please get test tokens from the faucet.`
      );
      console.error('❌', err.message);
      setError(err);
      setStep('error');
      onErrorRef.current?.(err);
      throw err;
    }
    
    console.log('🔐 Starting USDC approval...');
    setStep('approving');
    setError(null);
    
    try {
      await approval.approve();
    } catch (err) {
      console.error('❌ Approval failed:', err);
      const error = err as Error;

      let enhancedMessage = error.message;
      if (error.message?.includes('User rejected')) {
        enhancedMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        enhancedMessage = 'Insufficient ETH for gas fees. Get ETH from faucet.';
      } else if (error.message?.includes('execution reverted')) {
        enhancedMessage = 'Transaction reverted. Please check your USDC balance and try again.';
      } else if (error.message?.includes('Internal JSON-RPC error')) {
        enhancedMessage = 
          'RPC Error - Most likely insufficient gas.\n\n' +
          'Solutions:\n' +
          '1. Check ETH balance for gas\n' +
          '2. Get ETH from faucet\n' +
          '3. Wait 30s and retry';
      }
      
      const enhancedError = new Error(enhancedMessage);
      setError(enhancedError);
      setStep('error');
      onErrorRef.current?.(enhancedError);
      throw enhancedError;
    }
  }, [requiresApproval, hasEnoughBalance, totalRequired, userBalance, shortfall, approval]);

  const executeTransaction = useCallback(async () => {
    if (requiresApproval && step !== 'approved') {
      const err = new Error('Must approve USDC first');
      console.error('❌', err.message);
      setError(err);
      setStep('error');
      onErrorRef.current?.(err);
      throw err;
    }
    
    console.log('🚀 Executing contract transaction...', {
      contractAddress,
      functionName,
      args,
    });
    
    setStep('executing');
    setError(null);
    await estimateTransactionGas();
    
    try {
      const gasLimit = estimatedGas || 2000000n;
      
      writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        value: 0n,
        gas: gasLimit,
      } as any);
      
      setStep('confirming');
    } catch (err) {
      console.error('❌ Transaction execution failed:', err);
      const error = err as Error;
      let enhancedMessage = error.message;
      
      if (error.message?.includes('User rejected')) {
        enhancedMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        enhancedMessage = 'Insufficient ETH for gas fees';
      } else if (error.message?.includes('execution reverted')) {
        enhancedMessage = 'Contract execution reverted. Please check parameters and balances.';
      }
      
      const enhancedError = new Error(enhancedMessage);
      setError(enhancedError);
      setStep('error');
      onErrorRef.current?.(enhancedError);
      throw enhancedError;
    }
  }, [requiresApproval, step, contractAddress, abi, functionName, args, writeContract, estimatedGas, estimateTransactionGas]);

  const executeAll = useCallback(async () => {
    setError(null);

    if (!validation?.isValid) {
      const errorMessage = validation?.errors.join('\n') || 'Validation failed';
      const err = new Error(errorMessage);
      console.error('❌', err.message);
      setError(err);
      setStep('error');
      onErrorRef.current?.(err);
      return;
    }
    
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
      onErrorRef.current?.(error);
    }
  }, [validation, requiresApproval, executeApproval, executeTransaction]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setEstimatedGas(undefined);
    setValidation(null);
    approval.reset();
    resetWrite();
    refetchBalance();
    refetchAllowance();
  }, [approval, resetWrite, refetchBalance, refetchAllowance]);

  useEffect(() => {
    if (autoExecuteAfterApproval && step === 'approved' && approval.isSuccess) {
      console.log('✅ Approval confirmed, auto-executing transaction...');
      executeTransaction();
    }
  }, [autoExecuteAfterApproval, step, approval.isSuccess, executeTransaction]);

  useEffect(() => {
    if (isTxSuccess && txHash) {
      console.log('✅ Transaction confirmed!', txHash);
      setStep('success');
      refetchBalance();
      onTransactionSuccessRef.current?.(txHash);
    }
  }, [isTxSuccess, txHash, refetchBalance]);

  useEffect(() => {
    if (writeError) {
      console.error('❌ Write error:', writeError);
      const error = writeError as Error;
      setError(error);
      setStep('error');
      onErrorRef.current?.(error);
    }
  }, [writeError]);

  useEffect(() => {
    if (txError) {
      console.error('❌ Transaction confirmation error:', txError);
      const error = txError as Error;
      setError(error);
      setStep('error');
      onErrorRef.current?.(error);
    }
  }, [txError]);

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
    userBalance,
    hasEnoughBalance,
    validation,
    error,

    executeApproval,
    executeTransaction,
    executeAll,
    refetchAllowance,
    refetchBalance,
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
      isLoadingBalance ||
      approval.isApproving ||
      approval.isConfirming ||
      isWritePending ||
      isTxConfirming ||
      ['checking', 'approving', 'executing', 'confirming'].includes(step),
    isSuccess: step === 'success' && isTxSuccess,
    isError: step === 'error' || !!error,
    progress,
    estimatedGas,
    totalRequired,
    shortfall,
  };
}