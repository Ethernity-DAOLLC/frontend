import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { erc20Abi, parseUnits } from 'viem';
import { useUSDCAddress } from '@/hooks/usdc/usdcUtils';
import FactoryABI from '@/abis/PersonalFundFactory.json';
import { useWriteContractWithGas } from '@/hooks/gas/useWriteContractWithGas';
import type { RetirementPlan } from '@/types/retirement_types';

type CreateFundStep = 'idle' | 'checking' | 'approving' | 'approved' | 'creating' | 'confirming' | 'success' | 'error';

interface UseCreateFundProps {
  plan: RetirementPlan;
  factoryAddress: `0x${string}`;
  onSuccess?: (txHash: `0x${string}`, fundAddress?: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface UseCreateFundReturn {
  step: CreateFundStep;
  error: string | null;

  initialDeposit: bigint;
  feeAmount: bigint;
  netToOwner: bigint;

  hasEnoughUSDC: boolean;
  hasEnoughGas: boolean;
  needsApproval: boolean;
  currentAllowance: bigint;
  userBalance: bigint;

  approve: () => Promise<void>;
  createFund: () => Promise<void>;
  executeAll: () => Promise<void>;
  reset: () => void;

  isApproving: boolean;
  isApprovingConfirming: boolean;
  approvalHash?: `0x${string}`;
  isCreating: boolean;
  isCreatingConfirming: boolean;
  createHash?: `0x${string}`;

  isLoading: boolean;
  isSuccess: boolean;
  progress: number;
}

export function useCreateFund({
  plan,
  factoryAddress,
  onSuccess,
  onError,
}: UseCreateFundProps): UseCreateFundReturn {
  const { address: userAddress } = useAccount();
  const usdcAddress = useUSDCAddress();
  const [step, setStep] = useState<CreateFundStep>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const principal = parseUnits(plan.principal.toString(), 6);
  const monthlyDeposit = parseUnits(plan.monthlyDeposit.toString(), 6);
  const initialDeposit = principal + monthlyDeposit;
  const feeAmount = (initialDeposit * 3n) / 100n;
  const netToOwner = (initialDeposit * 97n) / 100n;

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
    args: userAddress && factoryAddress ? [userAddress, factoryAddress] : undefined,
    query: { enabled: !!userAddress && !!factoryAddress && !!usdcAddress },
  });

  const hasEnoughUSDC = userBalance >= initialDeposit;
  const hasEnoughGas = gasBalance >= parseUnits('0.005', 18);
  const needsApproval = currentAllowance < initialDeposit;

  // ✅ Usar useWriteContractWithGas en lugar de useWriteContract
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
    writeContract: writeCreateFund,
    data: createHash,
    isPending: isCreatePending,
    error: createError,
    reset: resetCreate,
  } = useWriteContractWithGas();

  const {
    isLoading: isCreatingConfirming,
    isSuccess: isCreateSuccess,
    data: createReceipt,
  } = useWaitForTransactionReceipt({ hash: createHash });

  const approve = useCallback(async () => {
    if (!userAddress || !usdcAddress || !factoryAddress) {
      const err = new Error('Missing required addresses');
      setError(err.message);
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
        `Required: ${(Number(initialDeposit) / 1e6).toFixed(2)} USDC\n` +
        `Available: ${(Number(userBalance) / 1e6).toFixed(2)} USDC`
      );
      setError(err.message);
      setStep('error');
      onError?.(err);
      throw err;
    }

    console.log('🔐 Starting USDC approval...');
    setStep('approving');
    setError(null);

    try {
      writeApproval({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [factoryAddress, initialDeposit],
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
    factoryAddress,
    needsApproval,
    hasEnoughUSDC,
    initialDeposit,
    userBalance,
    writeApproval,
    onError,
  ]);

  const createFund = useCallback(async () => {
    if (!userAddress || !factoryAddress) {
      const err = new Error('Missing required addresses');
      setError(err.message);
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

    console.log('🚀 Creating Personal Fund...');
    setStep('creating');
    setError(null);

    try {
      const currentAge = BigInt(plan.currentAge);
      const retirementAge = BigInt(plan.retirementAge);
      const desiredMonthly = parseUnits(plan.desiredMonthlyIncome.toString(), 6);
      const yearsPayments = BigInt(plan.yearsPayments);
      const interestRate = BigInt(Math.round(plan.interestRate * 100)); // basis points
      const timelockYears = BigInt(plan.timelockYears);

      console.log('📊 Contract parameters:', {
        principal: (Number(principal) / 1e6).toFixed(2),
        monthlyDeposit: (Number(monthlyDeposit) / 1e6).toFixed(2),
        currentAge: currentAge.toString(),
        retirementAge: retirementAge.toString(),
        desiredMonthly: (Number(desiredMonthly) / 1e6).toFixed(2),
        yearsPayments: yearsPayments.toString(),
        interestRate: interestRate.toString() + ' basis points',
        timelockYears: timelockYears.toString(),
      });

      writeCreateFund({
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'createPersonalFund',
        args: [
          principal,
          monthlyDeposit,
          currentAge,
          retirementAge,
          desiredMonthly,
          yearsPayments,
          interestRate,
          timelockYears,
        ],
      });
    } catch (err: any) {
      console.error('❌ Create fund failed:', err);
      setError(err.shortMessage || err.message || 'Failed to create fund');
      setStep('error');
      onError?.(err);
      throw err;
    }
  }, [
    userAddress,
    factoryAddress,
    needsApproval,
    step,
    plan,
    principal,
    monthlyDeposit,
    writeCreateFund,
    onError,
  ]);

  const executeAll = useCallback(async () => {
    setError(null);

    if (!hasEnoughUSDC) {
      const err = new Error(
        `Insufficient USDC balance.\n\n` +
        `Required: ${(Number(initialDeposit) / 1e6).toFixed(2)} USDC\n` +
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
        console.log('📋 Flow: Approval → Create Fund');
        await approve();
      } else {
        console.log('📋 Flow: Create Fund only (no approval needed)');
        await createFund();
      }
    } catch (err: any) {
      console.error('❌ executeAll failed:', err);
      setError(err.message);
      setStep('error');
      onError?.(err);
    }
  }, [
    hasEnoughUSDC,
    hasEnoughGas,
    initialDeposit,
    userBalance,
    needsApproval,
    approve,
    createFund,
    onError,
  ]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    resetApproval();
    resetCreate();
  }, [resetApproval, resetCreate]);

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && step === 'approving') {
      console.log('✅ Approval confirmed, refetching allowance...');
      refetchAllowance();
      setStep('approved');
      setTimeout(() => {
        createFund();
      }, 1500);
    }
  }, [isApprovalSuccess, approvalHash, step, refetchAllowance, createFund]);

  useEffect(() => {
    if (approvalError && step === 'approving') {
      console.error('❌ Approval error:', approvalError);
      setError((approvalError as any).shortMessage || 'Approval failed');
      setStep('error');
      onError?.(approvalError as Error);
    }
  }, [approvalError, step, onError]);

  useEffect(() => {
    if (createError && (step === 'creating' || step === 'approved')) {
      console.error('❌ Create fund error:', createError);
      setError((createError as any).shortMessage || 'Failed to create fund');
      setStep('error');
      onError?.(createError as Error);
    }
  }, [createError, step, onError]);

  useEffect(() => {
    if (isCreateSuccess && createHash && step === 'confirming') {
      console.log('✅ Fund created successfully!', createReceipt);
      setStep('success');

      let fundAddress: `0x${string}` | undefined;
      if (createReceipt?.logs && createReceipt.logs.length > 0) {
        const fundCreatedLog = createReceipt.logs.find(log => 
          log.topics && log.topics.length > 1
        );
        if (fundCreatedLog && fundCreatedLog.topics[1]) {
          fundAddress = `0x${fundCreatedLog.topics[1].slice(-40)}` as `0x${string}`;
        }
      }
      onSuccess?.(createHash, fundAddress);
    }
  }, [isCreateSuccess, createHash, createReceipt, step, onSuccess]);

  useEffect(() => {
    if (isCreatingConfirming && step === 'creating') {
      setStep('confirming');
    }
  }, [isCreatingConfirming, step]);

  const progress = (() => {
    switch (step) {
      case 'idle': return 0;
      case 'checking': return 10;
      case 'approving': return 25;
      case 'approved': return 50;
      case 'creating': return 70;
      case 'confirming': return 90;
      case 'success': return 100;
      case 'error': return 0;
      default: return 0;
    }
  })();

  return {
    step,
    error,

    initialDeposit,
    feeAmount,
    netToOwner,

    hasEnoughUSDC,
    hasEnoughGas,
    needsApproval,
    currentAllowance,
    userBalance,

    approve,
    createFund,
    executeAll,
    reset,

    isApproving: isApprovePending,
    isApprovingConfirming,
    approvalHash,
    isCreating: isCreatePending,
    isCreatingConfirming,
    createHash,

    isLoading: step !== 'idle' && step !== 'success' && step !== 'error',
    isSuccess: step === 'success',
    progress,
  };
}