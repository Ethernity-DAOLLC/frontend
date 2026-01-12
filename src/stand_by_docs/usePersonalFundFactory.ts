import { useState, useCallback, useEffect } from 'react';
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
  hash: `0x${string}` | undefined;
  error: string | null;

  createPersonalFund: (params: CreateParams) => Promise<void>;
  useCalculateInitialDeposit: (principal: bigint, monthlyDeposit: bigint) => any;
  refetch: () => void;
  refetchAllowance: () => void;
}

export function usePersonalFundFactory(factoryAddress?: `0x${string}`): UsePersonalFundFactoryReturn {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const usdcAddress = useUSDCAddress();
  const { writeContract, data: writeHash, isPending: isWritePending, reset: resetWrite } = useWriteContract();
  const [creationStep, setCreationStep] = useState<'idle' | 'approving' | 'creating' | 'success' | 'error'>('idle');
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>(undefined);
  const [createHash, setCreateHash] = useState<`0x${string}` | undefined>(undefined);
  const [pendingParams, setPendingParams] = useState<CreateParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const contracts = factoryAddress && userAddress && usdcAddress
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
        { address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: [userAddress] },
        { address: usdcAddress, abi: erc20Abi, functionName: 'allowance', args: [userAddress, factoryAddress] },
      ]
    : [];

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { 
      enabled: !!factoryAddress && !!userAddress && !!usdcAddress,
    },
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
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess, isError: isApproveError } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess, isError: isCreateError } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  useEffect(() => {
    if (isApproveSuccess && creationStep === 'approving' && pendingParams && factoryAddress) {
      console.log('✅ USDC approval confirmed, proceeding to create fund...');
      setTimeout(async () => {
        try {
          await refetch();
          
          setCreationStep('creating');
          console.log('🏗️ Calling createPersonalFund on factory...');

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
        } catch (err) {
          console.error('❌ Error proceeding to fund creation:', err);
          setError('Failed to proceed with fund creation after approval');
          setCreationStep('error');
        }
      }, 1500);
    }
  }, [isApproveSuccess, creationStep, pendingParams, factoryAddress, writeContract, refetch]);

  useEffect(() => {
    if (isCreateSuccess) {
      console.log('✅ Fund creation successful!');
      setCreationStep('success');
      setPendingParams(null);
      setRetryCount(0);
      setError(null);
      resetWrite();
    }
    
    if (isCreateError) {
      console.error('❌ Fund creation failed');
      setError('Fund creation transaction failed');
      setCreationStep('error');
      setPendingParams(null);
      resetWrite();
    }

    if (isApproveError) {
      console.error('❌ Approval failed');
      setError('USDC approval failed. Please try again.');
      setCreationStep('error');
      setPendingParams(null);
      resetWrite();
    }
  }, [isCreateSuccess, isCreateError, isApproveError, resetWrite]);

  useEffect(() => {
    if (writeHash && creationStep === 'approving') {
      console.log('📝 Approval transaction hash:', writeHash);
      setApproveHash(writeHash);
    } else if (writeHash && creationStep === 'creating') {
      console.log('📝 Fund creation transaction hash:', writeHash);
      setCreateHash(writeHash);
    }
  }, [writeHash, creationStep]);

  const createPersonalFund = useCallback(
    async (params: CreateParams) => {
      if (!factoryAddress || !userAddress || !usdcAddress) {
        const errorMsg = 'Missing required addresses';
        console.error('❌', errorMsg, { factoryAddress, userAddress, usdcAddress });
        setError(errorMsg);
        return;
      }

      if (publicClient) {
        try {
          const ethBalance = await publicClient.getBalance({ address: userAddress });
          console.log('💰 ETH balance:', ethBalance.toString());
          if (ethBalance < BigInt(1000000000000000)) {
            console.warn('⚠️ Low ETH balance for gas fees');
            setError('Low ETH balance. You may not have enough for gas fees.');
          }
        } catch (err) {
          console.warn('⚠️ Could not check ETH balance:', err);
        }
      }

      const requiredAmount = params.principal + params.monthlyDeposit;
      console.log('🚀 Starting fund creation process...');
      console.log('💰 Parameters:', {
        principal: params.principal.toString(),
        monthlyDeposit: params.monthlyDeposit.toString(),
        requiredAmount: requiredAmount.toString(),
        currentAllowance: usdcAllowance?.toString() || '0',
        currentBalance: usdcBalance?.toString() || '0',
      });

      if (usdcBalance !== undefined && usdcBalance < requiredAmount) {
        const errorMsg = `Insufficient USDC balance. Required: ${requiredAmount.toString()}, Available: ${usdcBalance.toString()}`;
        console.error('❌', errorMsg);
        setError(errorMsg);
        return;
      }

      setPendingParams(params);
      resetWrite();
      setApproveHash(undefined);
      setCreateHash(undefined);
      setError(null);

      if (needsApproval(usdcAllowance, requiredAmount)) {
        console.log('🔐 Needs approval, requesting USDC approval...');
        setCreationStep('approving');

        try {
          console.log('📝 Approving infinite USDC allowance (maxUint256)...');
          
          writeContract({
            address: usdcAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [factoryAddress, maxUint256],
            // ⭐ Alternativa: aprobar solo el monto necesario
            // args: [factoryAddress, requiredAmount],
            
            // ⭐ OPCIONAL: Especificar gas manualmente si continúa fallando
            // gas: BigInt(100000),
            // gasPrice: BigInt(1000000000), // 1 gwei
          });
        } catch (err: any) {
          console.error('❌ Error requesting approval:', err);
          
          let errorMessage = 'Failed to request USDC approval';
          if (err.message?.includes('User rejected')) {
            errorMessage = 'Transaction rejected by user';
          } else if (err.message?.includes('insufficient funds')) {
            errorMessage = 'Insufficient ETH for gas fees';
          } else if (err.message?.includes('Internal JSON-RPC error')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          }
          
          setError(errorMessage);
          setCreationStep('error');
          setPendingParams(null);
        }
      } else {
        console.log('✅ Already approved, proceeding directly to fund creation...');
        setCreationStep('creating');

        try {
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
        } catch (err: any) {
          console.error('❌ Error creating fund:', err);
          
          let errorMessage = 'Failed to create fund';
          if (err.message?.includes('User rejected')) {
            errorMessage = 'Transaction rejected by user';
          } else if (err.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          setCreationStep('error');
          setPendingParams(null);
        }
      }
    },
    [factoryAddress, userAddress, usdcAddress, usdcAllowance, usdcBalance, writeContract, resetWrite, publicClient]
  );
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
    error,

    createPersonalFund,
    useCalculateInitialDeposit,
    refetch,
    refetchAllowance,
  };
}