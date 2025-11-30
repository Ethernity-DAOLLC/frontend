import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi';
import { erc20Abi } from 'viem';
import PersonalFundABI from '@/abis/PersonalFund.json';
import { parseUSDC, USDC_ADDRESS, needsApproval } from '../usdc/usdcUtils';

type TransactionStep = 'idle' | 'approving' | 'approved' | 'depositing' | 'success' | 'error';

interface UsePersonalFundWithApprovalProps {
  fundAddress: `0x${string}`;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePersonalFundWithApproval({
  fundAddress,
  onSuccess,
  onError,
}: UsePersonalFundWithApprovalProps) {
  const { address: userAddress } = useAccount();
  
  const [step, setStep] = useState<TransactionStep>('idle');
  const [pendingAmount, setPendingAmount] = useState<bigint>(0n);
  const [depositType, setDepositType] = useState<'regular' | 'monthly' | 'extra'>('regular');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress && fundAddress ? [userAddress, fundAddress] : undefined,
    query: { enabled: !!userAddress && !!fundAddress },
  });

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    isError: isApproveError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    reset: resetDeposit,
  } = useWriteContract();

  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositSuccess,
    isError: isDepositError,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => {
    if (isApproveSuccess && step === 'approving') {
      setStep('approved');
      refetchAllowance();
      
      setTimeout(() => {
        executeDeposit();
      }, 1000);
    }
  }, [isApproveSuccess, step]);

  useEffect(() => {
    if (isDepositSuccess && step === 'depositing') {
      setStep('success');
      onSuccess?.();
    }
  }, [isDepositSuccess, step, onSuccess]);

  useEffect(() => {
    if (isApproveError || isDepositError) {
      setStep('error');
      setErrorMessage('Transaction failed. Please try again.');
      onError?.(new Error('Transaction failed'));
    }
  }, [isApproveError, isDepositError, onError]);

  const executeDeposit = useCallback(() => {
    if (!fundAddress || pendingAmount === 0n) return;

    setStep('depositing');

    const functionName = depositType === 'monthly' 
      ? 'depositMonthly' 
      : depositType === 'extra' 
        ? 'depositExtra' 
        : 'deposit';

    const args = depositType === 'monthly' ? [] : [pendingAmount];

    writeDeposit({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName,
      args,
    });
  }, [fundAddress, pendingAmount, depositType, writeDeposit]);

  const deposit = useCallback(async (amount: string) => {
    if (!fundAddress || !userAddress) {
      setErrorMessage('Wallet not connected');
      return;
    }

    const amountWei = parseUSDC(amount);
    setPendingAmount(amountWei);
    setDepositType('regular');
    setErrorMessage(null);

    if (needsApproval(currentAllowance, amountWei)) {
      setStep('approving');
      writeApprove({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [fundAddress, amountWei],
      });
    } else {
      setStep('depositing');
      writeDeposit({
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'deposit',
        args: [amountWei],
      });
    }
  }, [fundAddress, userAddress, currentAllowance, writeApprove, writeDeposit]);

  const depositMonthly = useCallback(async (monthlyAmount: bigint) => {
    if (!fundAddress || !userAddress) {
      setErrorMessage('Wallet not connected');
      return;
    }

    setPendingAmount(monthlyAmount);
    setDepositType('monthly');
    setErrorMessage(null);

    if (needsApproval(currentAllowance, monthlyAmount)) {
      setStep('approving');
      writeApprove({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [fundAddress, monthlyAmount],
      });
    } else {
      setStep('depositing');
      writeDeposit({
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'depositMonthly',
      });
    }
  }, [fundAddress, userAddress, currentAllowance, writeApprove, writeDeposit]);

  const depositExtra = useCallback(async (amount: string) => {
    if (!fundAddress || !userAddress) {
      setErrorMessage('Wallet not connected');
      return;
    }

    const amountWei = parseUSDC(amount);
    setPendingAmount(amountWei);
    setDepositType('extra');
    setErrorMessage(null);

    if (needsApproval(currentAllowance, amountWei)) {
      setStep('approving');
      writeApprove({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [fundAddress, amountWei],
      });
    } else {
      setStep('depositing');
      writeDeposit({
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'depositExtra',
        args: [amountWei],
      });
    }
  }, [fundAddress, userAddress, currentAllowance, writeApprove, writeDeposit]);

  const approveMax = useCallback(() => {
    if (!fundAddress) return;

    setStep('approving');
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    
    writeApprove({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [fundAddress, maxUint256],
    });
  }, [fundAddress, writeApprove]);

  const reset = useCallback(() => {
    setStep('idle');
    setPendingAmount(0n);
    setDepositType('regular');
    setErrorMessage(null);
    resetApprove();
    resetDeposit();
  }, [resetApprove, resetDeposit]);

  const isProcessing = step === 'approving' || step === 'depositing';
  const isPending = isApprovePending || isDepositPending;
  const isConfirming = isApproveConfirming || isDepositConfirming;

  const stepMessage: Record<TransactionStep, string> = {
    idle: '',
    approving: 'Approving USDC...',
    approved: 'USDC approved! Proceeding to deposit...',
    depositing: 'Depositing USDC...',
    success: 'Deposit successful!',
    error: errorMessage || 'Transaction failed',
  };

  return {
    step,
    stepMessage: stepMessage[step],
    pendingAmount,
    currentAllowance,
    errorMessage,

    deposit,
    depositMonthly,
    depositExtra,
    approveMax,
    reset,
    refetchAllowance,

    isProcessing,
    isPending,
    isConfirming,
    isSuccess: step === 'success',
    isError: step === 'error',

    approveHash,
    depositHash,
    needsApproval: (amount: bigint) => needsApproval(currentAllowance, amount),
  };
}

export function useUSDCAllowanceForFund(fundAddress?: `0x${string}`) {
  const { address: userAddress } = useAccount();

  const { data: allowance, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress && fundAddress ? [userAddress, fundAddress] : undefined,
    query: { enabled: !!userAddress && !!fundAddress },
  });

  return {
    allowance: allowance as bigint | undefined,
    hasAllowance: (amount: bigint) => !needsApproval(allowance, amount),
    refetch,
  };
}