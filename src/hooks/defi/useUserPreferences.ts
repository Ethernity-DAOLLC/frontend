import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import UserPreferencesABI from '@/abis/UserPreferences.json';

export function useUserPreferences(preferencesAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: preferencesAddress,
        abi: UserPreferencesABI,
        functionName: 'admin',
      },
      {
        address: preferencesAddress,
        abi: UserPreferencesABI,
        functionName: 'treasury',
      },
      {
        address: preferencesAddress,
        abi: UserPreferencesABI,
        functionName: 'protocolRegistry',
      },
      {
        address: preferencesAddress,
        abi: UserPreferencesABI,
        functionName: 'getUserConfig',
        args: [userAddress],
      },
      {
        address: preferencesAddress,
        abi: UserPreferencesABI,
        functionName: 'isContractAuthorized',
        args: [userAddress],
      },
    ],
  });

  const [admin, treasury, protocolRegistry, userConfig, isContractAuthorized] = data || [];
  const useGetRecommendedProtocol = (user: `0x${string}`) => {
    return useReadContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'getRecommendedProtocol',
      args: [user],
    });
  };

  const useGetProtocolDeposits = (protocol: `0x${string}`) => {
    return useReadContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'getProtocolDeposits',
      args: [protocol],
    });
  };

  const setUserConfig = (
    selectedProtocol: `0x${string}`,
    autoCompound: boolean,
    riskTolerance: number
  ) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'setUserConfig',
      args: [selectedProtocol, autoCompound, riskTolerance],
    });
  };

  const routeDeposit = (user: `0x${string}`, amount: bigint) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'routeDeposit',
      args: [user, amount],
    });
  };

  const setTreasury = (treasuryAddress: `0x${string}`) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'setTreasury',
      args: [treasuryAddress],
    });
  };

  const setProtocolRegistry = (registryAddress: `0x${string}`) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'setProtocolRegistry',
      args: [registryAddress],
    });
  };

  const authorizeContract = (contract: `0x${string}`) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'authorizeContract',
      args: [contract],
    });
  };

  const revokeContract = (contract: `0x${string}`) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'revokeContract',
      args: [contract],
    });
  };

  const changeAdmin = (newAdmin: `0x${string}`) => {
    writeContract({
      address: preferencesAddress,
      abi: UserPreferencesABI,
      functionName: 'changeAdmin',
      args: [newAdmin],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    admin: admin?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    protocolRegistry: protocolRegistry?.result as `0x${string}` | undefined,
    userConfig: userConfig?.result as
      | {
          selectedProtocol: `0x${string}`;
          autoCompound: boolean;
          riskTolerance: number;
          lastUpdate: bigint;
        }
      | undefined,
    isContractAuthorized: isContractAuthorized?.result as boolean | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,

    useGetRecommendedProtocol,
    useGetProtocolDeposits,

    setUserConfig,
    routeDeposit,
    setTreasury,
    setProtocolRegistry,
    authorizeContract,
    revokeContract,
    changeAdmin,
    refetch,
  };
}
