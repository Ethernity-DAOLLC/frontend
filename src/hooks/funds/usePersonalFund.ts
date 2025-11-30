import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  type UseReadContractReturnType,
} from 'wagmi';
import PersonalFundABI from '@/abis/PersonalFund.json';

export interface PersonalFundData {
  initialized?: boolean;
  owner?: `0x${string}`;
  treasury?: `0x${string}`;
  admin?: `0x${string}`;
  balance?: bigint;
  fundInfo?: {
    owner: `0x${string}`;
    principal: bigint;
    monthlyDeposit: bigint;
    retirementAge: bigint;
    totalDeposited: bigint;
    totalWithdrawn: bigint;
    retirementStarted: boolean;
  };
  timelockInfo?: {
    timelockEnd: bigint;
    remainingTime: bigint;
    isUnlocked: boolean;
  };
  canStartRetirement?: boolean;
  isEarlyRetirementApproved?: boolean;
}

export function usePersonalFund(fundAddress?: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data, isLoading, isError, error, refetch } = useReadContracts({
    contracts: [
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'initialized',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'owner',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'treasury',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'admin',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'getBalance',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'getFundInfo',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'getTimelockInfo',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'canStartRetirement',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'isEarlyRetirementApproved',
      },
    ],
    query: {
      enabled: !!fundAddress,
    },
  });

  const [
    initialized,
    owner,
    treasury,
    admin,
    balance,
    fundInfo,
    timelockInfo,
    canStartRetirement,
    isEarlyRetirementApproved,
  ] = data || [];

  const parsedFundInfo = fundInfo?.result
    ? {
        owner: fundInfo.result[0] as `0x${string}`,
        principal: fundInfo.result[1] as bigint,
        monthlyDeposit: fundInfo.result[2] as bigint,
        retirementAge: fundInfo.result[3] as bigint,
        totalDeposited: fundInfo.result[4] as bigint,
        totalWithdrawn: fundInfo.result[5] as bigint,
        retirementStarted: fundInfo.result[6] as boolean,
      }
    : undefined;

  const parsedTimelockInfo = timelockInfo?.result
    ? {
        timelockEnd: timelockInfo.result[0] as bigint,
        remainingTime: timelockInfo.result[1] as bigint,
        isUnlocked: timelockInfo.result[2] as boolean,
      }
    : undefined;

  const initialize = (
    treasuryAddress: `0x${string}`,
    adminAddress: `0x${string}`,
    ownerAddress: `0x${string}`,
    _principal: bigint,
    _monthlyDeposit: bigint,
    _currentAge: bigint,
    _retirementAge: bigint,
    _desiredMonthly: bigint,
    _yearsPayments: bigint,
    _interestRate: bigint,
    _timelockYears: bigint,
    value: bigint
  ) => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'initialize',
      args: [
        treasuryAddress,
        adminAddress,
        ownerAddress,
        _principal,
        _monthlyDeposit,
        _currentAge,
        _retirementAge,
        _desiredMonthly,
        _yearsPayments,
        _interestRate,
        _timelockYears,
      ],
      value,
    });
  };

  const deposit = (amount: bigint) => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'deposit',
      value: amount,
    });
  };

  const depositMonthly = (amount: bigint) => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'depositMonthly',
      value: amount,
    });
  };

  const startRetirement = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'startRetirement',
    });
  };

  const withdrawMonthly = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'withdrawMonthly',
    });
  };

  const emergencyWithdraw = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'emergencyWithdraw',
    });
  };

  const approveEarlyRetirement = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'approveEarlyRetirement',
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    initialized: initialized?.result as boolean | undefined,
    owner: owner?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    admin: admin?.result as `0x${string}` | undefined,
    balance: balance?.result as bigint | undefined,
    fundInfo: parsedFundInfo,
    timelockInfo: parsedTimelockInfo,
    canStartRetirement: canStartRetirement?.result as boolean | undefined,
    isEarlyRetirementApproved: isEarlyRetirementApproved?.result as boolean | undefined,

    isLoading,
    isError,
    error,
    isPending,
    isConfirming,
    isSuccess,
    hash,

    initialize,
    deposit,
    depositMonthly,
    startRetirement,
    withdrawMonthly,
    emergencyWithdraw,
    approveEarlyRetirement,
    refetch,
  };
}

export const personalFundQueries = {
  principal: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'principal' as const,
  }),
  
  monthlyDeposit: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'monthlyDeposit' as const,
  }),
  
  currentAge: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'currentAge' as const,
  }),
  
  retirementAge: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'retirementAge' as const,
  }),
  
  desiredMonthly: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'desiredMonthly' as const,
  }),
  
  yearsPayments: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'yearsPayments' as const,
  }),
  
  interestRate: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'interestRate' as const,
  }),
  
  totalDeposited: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'totalDeposited' as const,
  }),
  
  totalWithdrawn: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'totalWithdrawn' as const,
  }),
  
  createdAt: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'createdAt' as const,
  }),
  
  retirementStarted: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'retirementStarted' as const,
  }),
  
  retirementStartTime: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'retirementStartTime' as const,
  }),
  
  timelockPeriod: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'timelockPeriod' as const,
  }),
  
  timelockEnd: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'timelockEnd' as const,
  }),
  
  earlyRetirementApproved: (fundAddress: `0x${string}`) => ({
    address: fundAddress,
    abi: PersonalFundABI,
    functionName: 'earlyRetirementApproved' as const,
  }),
};
