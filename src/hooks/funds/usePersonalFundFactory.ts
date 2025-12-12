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

export function usePersonalFundFactory(factoryAddress: `0x${string}`) {
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
        functionName: 'getConfiguration',
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
        functionName: 'getUserFundCount',
        args: [userAddress],
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
    configuration,
    userFund,
    canUserCreateFund,
    userFundCount,
  ] = data || [];

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress ? [userAddress, factoryAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const parsedConfig = configuration?.result
    ? {
        minPrincipal: configuration.result[0] as bigint,
        maxPrincipal: configuration.result[1] as bigint,
        minMonthlyDeposit: configuration.result[2] as bigint,
        minAge: configuration.result[3] as bigint,
        maxAge: configuration.result[4] as bigint,
        minRetirementAge: configuration.result[5] as bigint,
        minTimelockYears: configuration.result[6] as bigint,
        maxTimelockYears: configuration.result[7] as bigint,
      }
    : undefined;

  const createPersonalFund = useCallback(
    async (params: {
      principal: bigint;
      monthlyDeposit: bigint;
      currentAge: number;
      retirementAge: number;
      desiredMonthly: bigint;
      yearsPayments: number;
      interestRate: number;
      timelockYears: number;
    }) => {
      if (!userAddress) throw new Error('Wallet not connected');
      const initialDeposit = params.principal + params.monthlyDeposit;

      if (!usdcBalance || BigInt(usdcBalance) < initialDeposit) {
        throw new Error(`Insufficient USDC balance. Need ${initialDeposit} USDC`);
      }

      if (!usdcAllowance || BigInt(usdcAllowance) < initialDeposit) {
        setCreationStep('approving');
        
        writeContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [factoryAddress, initialDeposit],
          value: 0n,
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));
        await refetchAllowance();
      }
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
    },
    [userAddress, usdcBalance, usdcAllowance, factoryAddress, writeContract, refetchAllowance]
  );

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
    usdcBalance: usdcBalance as bigint | undefined,
    usdcAllowance: usdcAllowance as bigint | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,
    creationStep,
    createPersonalFund,
    refetch,
    refetchAllowance,
  };
}