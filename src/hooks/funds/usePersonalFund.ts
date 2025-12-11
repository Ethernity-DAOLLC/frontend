import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import PersonalFundABI from '@/abis/PersonalFund.json';

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
        functionName: 'usdc',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'getFundInfo',
      },
      {
        address: fundAddress,
        abi: PersonalFundABI,
        functionName: 'getDepositStats',
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
    usdc,
    fundInfo,
    depositStats,
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
        totalGrossDeposited: fundInfo.result[4] as bigint,
        totalFeesPaid: fundInfo.result[5] as bigint,
        totalNetToOwner: fundInfo.result[6] as bigint,
        retirementStarted: fundInfo.result[7] as boolean,
      }
    : undefined;

  const parsedDepositStats = depositStats?.result
    ? {
        totalGrossDeposited: depositStats.result[0] as bigint,
        totalFeesPaid: depositStats.result[1] as bigint,
        totalNetToOwner: depositStats.result[2] as bigint,
        monthlyDepositCount: depositStats.result[3] as bigint,
      }
    : undefined;

  const parsedTimelockInfo = timelockInfo?.result
    ? {
        timelockEnd: timelockInfo.result[0] as bigint,
        remainingTime: timelockInfo.result[1] as bigint,
        isUnlocked: timelockInfo.result[2] as boolean,
      }
    : undefined;

  const depositMonthly = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'depositMonthly',
      args: [], // No recibe argumentos
    });
  };

  const startRetirement = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'startRetirement',
      args: [],
    });
  };

  const approveEarlyRetirement = () => {
    if (!fundAddress) throw new Error('Fund address not provided');

    writeContract({
      address: fundAddress,
      abi: PersonalFundABI,
      functionName: 'approveEarlyRetirement',
      args: [],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    initialized: initialized?.result as boolean | undefined,
    owner: owner?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    admin: admin?.result as `0x${string}` | undefined,
    usdc: usdc?.result as `0x${string}` | undefined,
    fundInfo: parsedFundInfo,
    depositStats: parsedDepositStats,
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
    depositMonthly,
    startRetirement,
    approveEarlyRetirement,
    refetch,
  };
}
