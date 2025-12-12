import { useState, useCallback } from 'react';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { erc20Abi } from 'viem';
import FactoryABI from '@/abis/PersonalFundFactory.json';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;

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
  maxMonthlyDeposit: bigint;
  minInterestRate: bigint;
  maxInterestRate: bigint;
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
  creationStep: 'idle' | 'approving' | 'creating';
  hash: `0x${string}` | undefined;

  createPersonalFund: (params: CreateParams) => void;
  refetch: () => void;
  refetchAllowance: () => void;
}

export function usePersonalFundFactory(factoryAddress: `0x${string}`): UsePersonalFundFactoryReturn {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [creationStep, setCreationStep] = useState<'idle' | 'approving' | 'creating'>('idle');
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'admin',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'treasury',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'token',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'usdc',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'personalFundImplementation',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'totalFundsCreated',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'configuration',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'getUserFund',
        args: [userAddress],
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'canUserCreateFund',
        args: [userAddress],
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'userFundCount',
        args: [userAddress],
      },
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, factoryAddress],
      },
    ],
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
        maxMonthlyDeposit: config.result[3] as bigint,
        minInterestRate: config.result[4] as bigint,
        maxInterestRate: config.result[5] as bigint,
        minTimelockYears: config.result[6] as bigint,
        maxTimelockYears: config.result[7] as bigint,
      }
    : undefined;

  const usdcBalance = usdcBalanceData?.result as bigint | undefined;
  const usdcAllowance = usdcAllowanceData?.result as bigint | undefined;

  const refetchAllowance = async () => {
    await refetch();
  };

  const createPersonalFund = useCallback(async (params: CreateParams) => {
    if (!userAddress) return;

    setCreationStep('approving');

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
  }, [userAddress, usdcBalance, usdcAllowance, factoryAddress, writeContract, refetchAllowance]);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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
    createPersonalFund,
    refetch,
    refetchAllowance,
    hash,
  };
}