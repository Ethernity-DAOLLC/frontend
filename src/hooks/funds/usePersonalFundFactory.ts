import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { erc20Abi, maxUint256 } from 'viem';
import FactoryABI from '@/abis/PersonalFundFactory.json';
import { useUSDCAddress, needsApproval } from '@/hooks/usdc/usdcUtils';

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
  error: string | null;
  newFundAddress: `0x${string}` | undefined;
  approveHash: `0x${string}` | undefined;
  createHash: `0x${string}` | undefined;
  createPersonalFund: (params: CreateParams) => Promise<void>;
  resetCreation: () => void;
  refetch: () => void;
  refetchAllowance: () => void;
}

export function usePersonalFundFactory(
  factoryAddress?: `0x${string}`
): UsePersonalFundFactoryReturn {
  const { address: userAddress, connector } = useAccount(); 
  const publicClient = usePublicClient();
  const usdcAddress = useUSDCAddress();
  const [creationStep, setCreationStep] = useState<
    'idle' | 'approving' | 'creating' | 'success' | 'error'
  >('idle');
  
  const [error, setError] = useState<string | null>(null);
  const [newFundAddress, setNewFundAddress] = useState<`0x${string}` | undefined>(undefined);
  const [pendingParams, setPendingParams] = useState<CreateParams | null>(null);
  const { writeContract, data: writeHash, isPending: isWritePending, reset: resetWrite } =
    useWriteContract();
  const {
    data: [admin, treasury, token, usdc, personalFundImplementation, totalFundsCreated, configData, userFund, canUserCreateFund, userFundCount],
    isLoading,
    refetch,
  } = useReadContracts({
    contracts: [
      { address: factoryAddress, abi: FactoryABI, functionName: 'admin' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'treasury' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'token' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'usdc' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'personalFundImplementation' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'totalFundsCreated' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'getConfiguration' },
      { address: factoryAddress, abi: FactoryABI, functionName: 'userFunds', args: [userAddress] },
      { address: factoryAddress, abi: FactoryABI, functionName: 'canUserCreateFund', args: [userAddress] },
      { address: factoryAddress, abi: FactoryABI, functionName: 'userFundCount', args: [userAddress] },
    ],
    query: {
      enabled: !!factoryAddress && !!userAddress,
    },
  });

  const parsedConfig = configData?.result
    ? {
        minPrincipal: configData.result[0] as bigint,
        maxPrincipal: configData.result[1] as bigint,
        minMonthlyDeposit: configData.result[2] as bigint,
        minAge: configData.result[3] as bigint,
        maxAge: configData.result[4] as bigint,
        minRetirementAge: configData.result[5] as bigint,
        minTimelockYears: configData.result[6] as bigint,
        maxTimelockYears: configData.result[7] as bigint,
      }
    : undefined;

  const createPersonalFundInternal = useCallback(async () => {
    if (!pendingParams || !factoryAddress || !userAddress) return;

    try {
      setCreationStep('creating');

      const hash = await writeContract({
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'createPersonalFund',
        args: [
          pendingParams.principal,
          pendingParams.monthlyDeposit,
          pendingParams.currentAge,
          pendingParams.retirementAge,
          pendingParams.desiredMonthly,
          pendingParams.yearsPayments,
          pendingParams.interestRate,
          pendingParams.timelockYears,
        ],
        // gas: 800_000n,       
        // maxFeePerGas: 2_000_000_000n,
      });
      setNewFundAddress(undefined);
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Failed to create personal fund');
      setCreationStep('error');
    }
  }, [pendingParams, factoryAddress, userAddress, writeContract]);

  const createPersonalFund = useCallback(
    async (params: CreateParams) => {
      if (!factoryAddress || !usdcAddress || !userAddress) {
        setError('Missing required data (factory, USDC or wallet address)');
        setCreationStep('error');
        return;
      }

      if (!connector || typeof connector.getChainId !== 'function') {
        setError(
          'Wallet connector is not ready. Please disconnect and reconnect your wallet, then try again.'
        );
        setCreationStep('error');
        return;
      }

      const requiredAmount = params.principal;
      setError(null);
      setNewFundAddress(undefined);
      setPendingParams(params);
      setCreationStep('approving');
      resetWrite();

      const needsApprove = needsApproval(requiredAmount);
      if (needsApprove) {
        try {
          const hash = await writeContract({
            address: usdcAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [factoryAddress, maxUint256],
          });
        } catch (err: any) {
          setError(err.shortMessage || 'Approval transaction failed');
          setCreationStep('error');
        }
      } else {
        setCreationStep('creating');
        createPersonalFundInternal();
      }
    },
    [
      factoryAddress,
      usdcAddress,
      userAddress,
      connector,
      writeContract,
      resetWrite,
      createPersonalFundInternal,
    ]
  );

  const resetCreation = useCallback(() => {
    setCreationStep('idle');
    setError(null);
    setNewFundAddress(undefined);
    setPendingParams(null);
    resetWrite();
  }, [resetWrite]);

  const isPending = isWritePending;
  const isConfirming = !!writeHash; 
  const isSuccess = creationStep === 'success';

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
    usdcBalance: 0n,   
    usdcAllowance: 0n,  
    isLoading,
    isPending,
    isConfirming,
    isSuccess,
    creationStep,
    error,
    newFundAddress,
    approveHash: undefined,
    createHash: writeHash,
    createPersonalFund,
    resetCreation,
    refetch,
    refetchAllowance: refetch,
  };
}