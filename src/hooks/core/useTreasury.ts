import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import TreasuryABI from '@/abis/Treasury.json';

export function useTreasury(treasuryAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'admin',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'governance',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'token',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'usdc',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'fundCount',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'pendingCount',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'getTotalFeesCollected',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'feePercentage',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'getTreasuryBalance',
      },
      {
        address: treasuryAddress,
        abi: TreasuryABI,
        functionName: 'isTreasuryManager',
        args: [userAddress],
      },
    ],
  });

  const [
    admin,
    governance,
    token,
    usdc,
    fundCount,
    pendingCount,
    totalFeesCollected,
    feePercentage,
    treasuryBalance,
    isTreasuryManager,
  ] = data || [];

  // ✅ Funciones que SÍ existen en Treasury.vy
  
  const setGovernance = (governanceAddress: `0x${string}`) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'setGovernance',
      args: [governanceAddress],
    });
  };

  const setToken = (tokenAddress: `0x${string}`) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'setToken',
      args: [tokenAddress],
    });
  };

  const addTreasuryManager = (manager: `0x${string}`) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'addTreasuryManager', // ✅ Corregido: era "addTreasureManager"
      args: [manager],
    });
  };

  const removeTreasuryManager = (manager: `0x${string}`) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'removeTreasuryManager',
      args: [manager],
    });
  };

  const requestEarlyRetirement = (fundAddress: `0x${string}`, reason: string) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'requestEarlyRetirement',
      args: [fundAddress, reason],
    });
  };

  const linkProposalToRequest = (fundAddress: `0x${string}`, proposalId: bigint) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'linkProposalToRequest',
      args: [fundAddress, proposalId],
    });
  };

  const processEarlyRetirementVote = (proposalId: bigint, fundAddress: `0x${string}`) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'processEarlyRetirementVote',
      args: [proposalId, fundAddress],
    });
  };

  const withdrawFees = (recipient: `0x${string}`, amount: bigint) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'withdrawFees',
      args: [recipient, amount],
    });
  };

  const updateFeePercentage = (newFee: bigint) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'updateFeePercentage',
      args: [newFee],
    });
  };

  const changeAdmin = (newAdmin: `0x${string}`) => {
    writeContract({
      address: treasuryAddress,
      abi: TreasuryABI,
      functionName: 'changeAdmin',
      args: [newAdmin],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    admin: admin?.result as `0x${string}` | undefined,
    governance: governance?.result as `0x${string}` | undefined,
    token: token?.result as `0x${string}` | undefined,
    usdc: usdc?.result as `0x${string}` | undefined,
    fundCount: fundCount?.result as bigint | undefined,
    pendingCount: pendingCount?.result as bigint | undefined,
    totalFeesCollected: totalFeesCollected?.result as bigint | undefined,
    feePercentage: feePercentage?.result as bigint | undefined,
    treasuryBalance: treasuryBalance?.result as bigint | undefined,
    isTreasuryManager: isTreasuryManager?.result as boolean | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,

    setGovernance,
    setToken,
    addTreasuryManager,
    removeTreasuryManager,
    requestEarlyRetirement,
    linkProposalToRequest,
    processEarlyRetirementVote,
    withdrawFees,
    updateFeePercentage,
    changeAdmin,
    refetch,
  };
}