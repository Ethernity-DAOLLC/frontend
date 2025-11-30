import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import GovernanceABI from '@/abis/Governance.json';

export function useGovernance(governanceAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'admin',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'token',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'treasury',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'proposalCount',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'quorumPercentage',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'votingPeriod',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'minProposalDelay',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'getAllProposals',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'getActiveProposals',
      },
      {
        address: governanceAddress,
        abi: GovernanceABI,
        functionName: 'getVoterStats',
        args: [userAddress],
      },
    ],
  });

  const [
    admin,
    token,
    treasury,
    proposalCount,
    quorumPercentage,
    votingPeriod,
    minProposalDelay,
    allProposals,
    activeProposals,
    voterStats,
  ] = data || [];

  const useGetProposal = (proposalId: bigint) => {
    return useReadContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'getProposal',
      args: [proposalId],
    });
  };

  const useGetVoteResult = (proposalId: bigint) => {
    return useReadContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'getVoteResult',
      args: [proposalId],
    });
  };

  const useHasVoted = (proposalId: bigint, voter: `0x${string}`) => {
    return useReadContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'hasVoted',
      args: [proposalId, voter],
    });
  };

  const useGetVote = (proposalId: bigint, voter: `0x${string}`) => {
    return useReadContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'getVote',
      args: [proposalId, voter],
    });
  };

  const useHasReachedQuorum = (proposalId: bigint) => {
    return useReadContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'hasReachedQuorum',
      args: [proposalId],
    });
  };

  const useGetProposalState = (proposalId: bigint) => {
    return useReadContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'getProposalState',
      args: [proposalId],
    });
  };

  const createProposal = (
    title: string,
    description: string,
    proposalType: number,
    targetAddress: `0x${string}`,
    targetValue: bigint
  ) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'createProposal',
      args: [title, description, proposalType, targetAddress, targetValue],
    });
  };

  const castVote = (proposalId: bigint, support: boolean) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'castVote',
      args: [proposalId, support],
    });
  };

  const executeProposal = (proposalId: bigint) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'executeProposal',
      args: [proposalId],
    });
  };

  const cancelProposal = (proposalId: bigint) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'cancelProposal',
      args: [proposalId],
    });
  };

  const setTreasury = (treasuryAddress: `0x${string}`) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'setTreasury',
      args: [treasuryAddress],
    });
  };

  const setToken = (tokenAddress: `0x${string}`) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'setToken',
      args: [tokenAddress],
    });
  };

  const updateQuorum = (newQuorum: bigint) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'updateQuorum',
      args: [newQuorum],
    });
  };

  const updateVotingPeriod = (newPeriod: bigint) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'updateVotingPeriod',
      args: [newPeriod],
    });
  };

  const updateMinProposalDelay = (newDelay: bigint) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'updateMinProposalDelay',
      args: [newDelay],
    });
  };

  const changeAdmin = (newAdmin: `0x${string}`) => {
    writeContract({
      address: governanceAddress,
      abi: GovernanceABI,
      functionName: 'changeAdmin',
      args: [newAdmin],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    admin: admin?.result as `0x${string}` | undefined,
    token: token?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    proposalCount: proposalCount?.result as bigint | undefined,
    quorumPercentage: quorumPercentage?.result as bigint | undefined,
    votingPeriod: votingPeriod?.result as bigint | undefined,
    minProposalDelay: minProposalDelay?.result as bigint | undefined,
    allProposals: allProposals?.result as bigint[] | undefined,
    activeProposals: activeProposals?.result as bigint[] | undefined,
    voterStats: voterStats?.result as [bigint, bigint] | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,

    useGetProposal,
    useGetVoteResult,
    useHasVoted,
    useGetVote,
    useHasReachedQuorum,
    useGetProposalState,

    createProposal,
    castVote,
    executeProposal,
    cancelProposal,
    setTreasury,
    setToken,
    updateQuorum,
    updateVotingPeriod,
    updateMinProposalDelay,
    changeAdmin,
    refetch,
  };
}
