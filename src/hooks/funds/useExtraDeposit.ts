import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { erc20Abi, parseUnits } from 'viem';
import { useUSDCAddress } from '@/hooks/usdc/usdcUtils';
import PersonalFundABI from '@/abis/PersonalFund.json';
import { useWriteContractWithGas } from '@/hooks/gas/useWriteContractWithGas';

type ExtraDepositStep = 'idle' | 'checking' | 'approving' | 'approved' | 'depositing' | 'confirming' | 'success' | 'error';

interface UseExtraDepositProps {
  fundAddress: `0x${string}`;
  onSuccess?: (txHash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface UseExtraDepositReturn {
  step: ExtraDepositStep;
  error: string | null;
  amount: string;
  setAmount: (amount: string) => void;
  amountInWei: bigint;
  feeAmount: bigint;
  netToFund: bigint;
  hasEnoughUSDC: boolean;
  hasEnoughGas: boolean;
  needsApproval: boolean;
  isValidAmount: boolean;
  currentAllowance: bigint;
  userBalance: bigint;
  approve: () => Promise<void>;
  deposit: () => Promise<void>;
  executeAll: () => Promise<void>;
  reset: () => void;
  isApproving: boolean;
  isApprovingConfirming: boolean;
  approvalHash?: `0x${string}`;
  isDepositing: boolean;
  isDepositingConfirming: boolean;
  depositHash?: `0x${string}`;
  isLoading: boolean;
  isSuccess: boolean;
  progress: number;
}

export function useExtraDeposit({
  fundAddress,
  onSuccess,
  onError,
}: UseExtraDepositProps): UseExtraDepositReturn {
  const { address: userAddress } = useAccount();
  const usdcAddress = useUSDCAddress();
  const [step, setStep] = useState<ExtraDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('0');

  let amountInWei: bigint;
  try {
    amountInWei = parseUnits(amount || '0', 6);
  } catch {
    amountInWei = 0n;
  }

  const isValidAmount = amount !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const feeAmount = (amountInWei * 3n) / 100n;
  const netToFund = (amountInWei * 97n) / 100n;
  const { data: userBalance = 0n } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!usdcAddress },
  });

  const { data: gasBalance = 0n } = useReadContract({
    address: undefined,
    abi: [],
    functionName: 'balanceOf',
    args: [],
  });

  const { data: currentAllowance = 0n, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress && fundAddress ? [userAddress, fundAddress] : undefined,
    query: { enabled: !!userAddress && !!fundAddress && !!usdcAddress },
  });

  const hasEnoughUSDC = userBalance >= amountInWei && amountInWei > 0n;
  const hasEnoughGas = gasBalance >= parseUnits('0.003', 18);
  const needsApproval = currentAllowance < amountInWei;
  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApprovePending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContractWithGas();

  const {
    isLoading: isApprovingConfirming,
    isSuccess: isApprovalSuccess,
  } = useWaitForTransactionReceipt({ hash: approvalHash });

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContractWithGas();

  const {
    isLoading: isDepositingConfirming,
    isSuccess: isDepositSuccess,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  const approve = useCallback(async () => {
    if (!userAddress || !usdcAddress || !fundAddress) {
      const err = new Error('Missing required addresses');
      setError(err.message);
      onError?.(err);
      throw err;
    }

    if (!isValidAmount) {
      const err = new Error('Please enter a valid amount');
      setError(err.message);
      setStep('error');
      onError?.(err);
      throw err;
    }

    if (!needsApproval) {
      console.log('✅ Sufficient allowance, skipping approval');
      setStep('approved');
      return;
    }

    if (!hasEnoughUSDC) {
      const err = new Error(
        `Insufficient USDC balance.\n\n` +
        `Required: ${(Number(amountInWei) / 1e6).toFixed(2)} USDC\n` +
        `Available: ${(Number(userBalance) / 1e6).toFixed(2)} USDC`
      );
      setError(err.message);
      setStep('error');
      onError?.(err);
      throw err;
    }

    console.log('🔐 Approving USDC for extra deposit...');
    setStep('approving');
    setError(null);

    try {
      writeApproval({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [fundAddress, amountInWei],
      });
    } catch (err: any) {
      console.error('❌ Approval failed:', err);
      setError(err.shortMessage || err.message || 'Approval failed');
      setStep('error');
      onError?.(err);
      throw err;
    }
  }, [
    userAddress,
    usdcAddress,
    fundAddress,
    isValidAmount,
    needsApproval,
    hasEnoughUSDC,
    amountInWei,
    userBalance,
    writeApproval,
    onError,
  ]);

  const deposit = useCallback(async () => {
    if (!userAddress || !fundAddress) {
      const err = new Error('Missing required addresses');
      setError(err.message);
      onError?.(err);
      throw err;
    }

    if (!isValidAmount) {
      const err = new Error('Please enter a valid amount');
      setError(err.message);
      setStep('error');
      onError?.(err);
      throw err;
    }

    if (needsApproval && step !== 'approved') {
      const err = new Error('Must approve USDC first');
      setError(err.message);
      setStep('error');
      onError?.(err);
      throw err;
    }

    console.log('💰 Making extra deposit...');
    setStep('depositing');
    setError(null);

    try {
      writeDeposit({
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'depositExtra',
        args: [amountInWei], 
      });
    } catch (err: any) {
      console.error('❌ Deposit failed:', err);
      setError(err.shortMessage || err.message || 'Deposit failed');
      setStep('error');
      onError?.(err);
      throw err;
    }
  }, [
    userAddress,
    fundAddress,
    isValidAmount,
    needsApproval,
    step,
    amountInWei,
    writeDeposit,
    onError,
  ]);

  const executeAll = useCallback(async () => {
    setError(null);

    if (!isValidAmount) {
      const err = new Error('Please enter a valid amount greater than 0');
      setError(err.message);
      setStep('error');
      onError?.(err);
      return;
    }

    if (!hasEnoughUSDC) {
      const err = new Error(
        `Insufficient USDC balance.\n\n` +
        `Required: ${(Number(amountInWei) / 1e6).toFixed(2)} USDC\n` +
        `Available: ${(Number(userBalance) / 1e6).toFixed(2)} USDC`
      );
      setError(err.message);
      setStep('error');
      onError?.(err);
      return;
    }

    if (!hasEnoughGas) {
      const err = new Error('Insufficient ETH for gas fees');
      setError(err.message);
      setStep('error');
      onError?.(err);
      return;
    }

    try {
      if (needsApproval) {
        console.log('📋 Flow: Approval → Deposit');
        await approve();
      } else {
        console.log('📋 Flow: Deposit only (no approval needed)');
        await deposit();
      }
    } catch (err: any) {
      console.error('❌ executeAll failed:', err);
      setError(err.message);
      setStep('error');
      onError?.(err);
    }
  }, [
    isValidAmount,
    hasEnoughUSDC,
    hasEnoughGas,
    amountInWei,
    userBalance,
    needsApproval,
    approve,
    deposit,
    onError,
  ]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setAmount('0');
    resetApproval();
    resetDeposit();
  }, [resetApproval, resetDeposit]);

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      console.log('✅ Approval confirmed, refetching allowance...');
      refetchAllowance();
      setStep('approved');
      setTimeout(() => {
        deposit();
      }, 1500);
    }
  }, [isApprovalSuccess, approvalHash, step, refetchAllowance, deposit]);

  useEffect(() => {
    if (approvalError && step === 'approving') {
      console.error('❌ Approval error:', approvalError);
      setError((approvalError as any).shortMessage || 'Approval failed');
      setStep('error');
      onError?.(approvalError as Error);
    }
  }, [approvalError, step, onError]);

  useEffect(() => {
    if (depositError && (step === 'depositing' || step === 'approved')) {
      console.error('❌ Deposit error:', depositError);
      setError((depositError as any).shortMessage || 'Deposit failed');
      setStep('error');
      onError?.(depositError as Error);
    }
  }, [depositError, step, onError]);

  useEffect(() => {
    if (isDepositSuccess && depositHash && step === 'confirming') {
      console.log('✅ Extra deposit successful!', depositHash);
      setStep('success');
      onSuccess?.(depositHash);
    }
  }, [isDepositSuccess, depositHash, step, onSuccess]);

  useEffect(() => {
    if (isDepositingConfirming && step === 'depositing') {
      setStep('confirming');
    }
  }, [isDepositingConfirming, step]);

  const progress = (() => {
    switch (step) {
      case 'idle': return 0;
      case 'checking': return 10;
      case 'approving': return 30;
      case 'approved': return 50;
      case 'depositing': return 75;
      case 'confirming': return 90;
      case 'success': return 100;
      case 'error': return 0;
      default: return 0;
    }
  })();

  return {
    step,
    error,
    amount,
    setAmount,
    amountInWei,
    feeAmount,
    netToFund,
    hasEnoughUSDC,
    hasEnoughGas,
    needsApproval,
    isValidAmount,
    currentAllowance,
    userBalance,
    approve,
    deposit,
    executeAll,
    reset,
    isApproving: isApprovePending,
    isApprovingConfirming,
    approvalHash,
    isDepositing: isDepositPending,
    isDepositingConfirming,
    depositHash,
    isLoading: step !== 'idle' && step !== 'success' && step !== 'error',
    isSuccess: step === 'success',
    progress,
  };
}
