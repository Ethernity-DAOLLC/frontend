import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { erc20Abi } from 'viem';
import FactoryABI from '@/abis/PersonalFundFactory.json';
import { USDC_ADDRESS, needsApproval } from '@/hooks/usdc/usdcUtils';

interface CreateParams {
  principal: bigint;
  monthlyDeposit: bigint;
  currentAge: number;
  retirementAge: number;
  desiredMonthly: bigint;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}

interface FactoryConfiguration {
  minPrincipal: bigint;
  maxPrincipal: bigint;
  minMonthlyDeposit: bigint;
  minAge: bigint;
  maxAge: bigint;
  minRetirementAge: bigint;
  minTimelockYears: bigint;
  maxTimelockYears: bigint;
}

interface UsePersonalFundFactoryReturn {
  admin: `0x${string}` | undefined;
  treasury: `0x${string}` | undefined;
  token: `0x${string}` | undefined;
  usdc: `0x${string}` | undefined;
  personalFundImplementation: `0x${string}` | undefined;
  totalFundsCreated: bigint | undefined;
  configuration: FactoryConfiguration | undefined;
  userFund: `0x${string}` | undefined;
  canUserCreateFund: boolean | undefined;
  userFundCount: bigint | undefined;
  usdcBalance: bigint | undefined;
  usdcAllowance: bigint | undefined;
  isLoading: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  creationStep: 'idle' | 'approving' | 'creating' | 'success' | 'error';
  hash: `0x${string}` | undefined;

  createPersonalFund: (params: CreateParams) => Promise<void>;
  useCalculateInitialDeposit: (principal: bigint, monthlyDeposit: bigint) => any;
  refetch: () => void;
  refetchAllowance: () => void;
}

export function usePersonalFundFactory(factoryAddress?: `0x${string}`): UsePersonalFundFactoryReturn {
  const { address: userAddress } = useAccount();
  const { writeContract, data: writeHash, isPending: isWritePending, reset: resetWrite } = useWriteContract();
  const [creationStep, setCreationStep] = useState<'idle' | 'approving' | 'creating' | 'success' | 'error'>('idle');
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>(undefined);
  const [createHash, setCreateHash] = useState<`0x${string}` | undefined>(undefined);
  const [pendingParams, setPendingParams] = useState<CreateParams | null>(null);
  const { data, isLoading, refetch } = useReadContracts({
    contracts: factoryAddress
      ? [
          { address: factoryAddress, abi: FactoryABI, functionName: 'admin' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'treasury' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'token' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'usdc' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'personalFundImplementation' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'totalFundsCreated' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'getConfiguration' },
          { address: factoryAddress, abi: FactoryABI, functionName: 'getUserFund', args: [userAddress] },
          { address: factoryAddress, abi: FactoryABI, functionName: 'canUserCreateFund', args: [userAddress] },
          { address: factoryAddress, abi: FactoryABI, functionName: 'getUserFundCount', args: [userAddress] },
          { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [userAddress] },
          { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance', args: [userAddress, factoryAddress] },
        ]
      : [],
    query: { enabled: !!factoryAddress && !!userAddress },
  });

  const [
    admin,
    treasury,
    token,
    usdc,
    personalFundImplementation,
    totalFundsCreated,
    config,
    userFund,
    canUserCreateFund,
    userFundCount,
    usdcBalanceData,
    usdcAllowanceData,
  ] = data || [];

  const parsedConfig = config?.result
    ? {
        minPrincipal: config.result[0] as bigint,
        maxPrincipal: config.result[1] as bigint,
        minMonthlyDeposit: config.result[2] as bigint,
        minAge: config.result[3] as bigint,
        maxAge: config.result[4] as bigint,
        minRetirementAge: config.result[5] as bigint,
        minTimelockYears: config.result[6] as bigint,
        maxTimelockYears: config.result[7] as bigint,
      }
    : undefined;

  const usdcBalance = usdcBalanceData?.result as bigint | undefined;
  const usdcAllowance = usdcAllowanceData?.result as bigint | undefined;
  const refetchAllowance = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const useCalculateInitialDeposit = (principal: bigint, monthlyDeposit: bigint) => {
    return useReadContract({
      address: factoryAddress,
      abi: FactoryABI,
      functionName: 'calculateInitialDeposit',
      args: [principal, monthlyDeposit],
      query: { enabled: !!factoryAddress && principal > 0n && monthlyDeposit > 0n },
    });
  };

  const requiredInitialAmount = pendingParams ? pendingParams.principal + pendingParams.monthlyDeposit : 0n;
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess, isError: isApproveError } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess, isError: isCreateError } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  useEffect(() => {
    if (isApproveSuccess && creationStep === 'approving' && pendingParams && factoryAddress) {
      setCreationStep('creating');

      writeContract({
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'createPersonalFund',
        args: [
          pendingParams.principal,
          pendingParams.monthlyDeposit,
          BigInt(pendingParams.currentAge),
          BigInt(pendingParams.retirementAge),
          pendingParams.desiredMonthly,
          BigInt(pendingParams.yearsPayments),
          BigInt(pendingParams.interestRate),
          BigInt(pendingParams.timelockYears),
        ],
        value: 0n,
      });
    }
  }, [isApproveSuccess, creationStep, pendingParams, factoryAddress, writeContract]);

  useEffect(() => {
    if (isCreateSuccess) {
      setCreationStep('success');
      setPendingParams(null);
      resetWrite();
    }
    if (isCreateError || isApproveError) {
      setCreationStep('error');
      setPendingParams(null);
      resetWrite();
    }
  }, [isCreateSuccess, isCreateError, isApproveError, resetWrite]);

  const createPersonalFund = useCallback(
    async (params: CreateParams) => {
      if (!factoryAddress || !userAddress) return;
      const requiredAmount = params.principal + params.monthlyDeposit;

      setPendingParams(params);
      resetWrite();
      setApproveHash(undefined);
      setCreateHash(undefined);

      if (needsApproval(usdcAllowance, requiredAmount)) {
        setCreationStep('approving');
        writeContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [factoryAddress, requiredAmount],
        });

      } else {
        setCreationStep('creating');
        writeContract({
          address: factoryAddress,
          abi: FactoryABI,
          functionName: 'createPersonalFund',
          args: [
            params.principal,
            params.monthlyDeposit,
            BigInt(params.currentAge),
            BigInt(params.retirementAge),
            params.desiredMonthly,
            BigInt(params.yearsPayments),
            BigInt(params.interestRate),
            BigInt(params.timelockYears),
          ],
          value: 0n,
        });
      }
    },
    [factoryAddress, userAddress, usdcAllowance, writeContract, resetWrite]
  );

  useEffect(() => {
    if (writeHash && creationStep === 'approving') {
      setApproveHash(writeHash);
    } else if (writeHash && creationStep === 'creating') {
      setCreateHash(writeHash);
    }
  }, [writeHash, creationStep]);

  const isPending = isWritePending;
  const isConfirming = isApproveConfirming || isCreateConfirming;
  const isSuccess = creationStep === 'success';
  const hash = createHash || approveHash;

  return {
    admin: admin?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    token: token?.result as `0x${string}` | undefined,
    usdc: usdc?.result as `0x${string}` | undefined,
    personalFundImplementation: personalFundImplementation?.result as `0x${string}` | undefined,
    totalFundsCreated: totalFundsCreated?.result as bigint | undefined,
    configuration: parsedConfig,
    userFund: userFund?.result as `0x${string}` | undefined,
    canUserCreateFund: canUserCreateFund?.result as boolean | undefined,
    userFundCount: userFundCount?.result as bigint | undefined,
    usdcBalance,
    usdcAllowance,
    isLoading,
    isPending,
    isConfirming,
    isSuccess,
    creationStep,
    hash,
    createPersonalFund,
    useCalculateInitialDeposit,
    refetch,
    refetchAllowance,
  };
}