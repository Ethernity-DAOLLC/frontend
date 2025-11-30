import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import TokenABI from '@/abis/Token.json';

export function useToken(tokenAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'canVote',
        args: [userAddress],
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'totalSupply',
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'holderCount',
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'maxSupply',
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'currentSupply',
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'hasActivityThisMonth',
        args: [userAddress],
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'lastActivityTimestamp',
        args: [userAddress],
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'admin',
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'treasury',
      },
      {
        address: tokenAddress,
        abi: TokenABI,
        functionName: 'personalFundFactory',
      },
    ],
  });

  const [
    balance,
    canVote,
    totalSupply,
    holderCount,
    maxSupply,
    currentSupply,
    hasActivityThisMonth,
    lastActivityTimestamp,
    admin,
    treasury,
    personalFundFactory,
  ] = data || [];

  const useGetCurrentDate = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'getCurrentDate',
    });
  };

  const useGetNextBurnDate = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'getNextBurnDate',
    });
  };

  const useGetNextRenewDate = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'getNextRenewDate',
    });
  };

  const useCanBurnToday = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'canBurnToday',
    });
  };

  const useCanRenewToday = () => {
    return useReadContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'canRenewToday',
    });
  };

  const mintToNewHolder = (holder: `0x${string}`) => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'mintToNewHolder',
      args: [holder],
    });
  };

  const recordActivity = (user: `0x${string}`, activityType: string) => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'recordActivity',
      args: [user, activityType],
    });
  };

  const burnMonthlyTokens = () => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'burnMonthlyTokens',
    });
  };

  const renewMonthlyTokens = () => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'renewMonthlyTokens',
    });
  };

  const setTreasury = (treasuryAddress: `0x${string}`) => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'setTreasury',
      args: [treasuryAddress],
    });
  };

  const setPersonalFundFactory = (factory: `0x${string}`) => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'setPersonalFundFactory',
      args: [factory],
    });
  };

  const authorizeContract = (contract: `0x${string}`) => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'authorizeContract',
      args: [contract],
    });
  };

  const changeAdmin = (newAdmin: `0x${string}`) => {
    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'changeAdmin',
      args: [newAdmin],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    balance: balance?.result as bigint | undefined,
    canVote: canVote?.result as boolean | undefined,
    totalSupply: totalSupply?.result as bigint | undefined,
    holderCount: holderCount?.result as bigint | undefined,
    maxSupply: maxSupply?.result as bigint | undefined,
    currentSupply: currentSupply?.result as bigint | undefined,
    hasActivityThisMonth: hasActivityThisMonth?.result as boolean | undefined,
    lastActivityTimestamp: lastActivityTimestamp?.result as bigint | undefined,
    admin: admin?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    personalFundFactory: personalFundFactory?.result as `0x${string}` | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,

    useGetCurrentDate,
    useGetNextBurnDate,
    useGetNextRenewDate,
    useCanBurnToday,
    useCanRenewToday,

    mintToNewHolder,
    recordActivity,
    burnMonthlyTokens,
    renewMonthlyTokens,
    setTreasury,
    setPersonalFundFactory,
    authorizeContract,
    changeAdmin,
    refetch,
  };
}
