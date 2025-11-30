import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import ProtocolRegistryABI from '@/abis/ProtocolRegistry.json';

export function useProtocolRegistry(registryAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: registryAddress,
        abi: ProtocolRegistryABI,
        functionName: 'admin',
      },
      {
        address: registryAddress,
        abi: ProtocolRegistryABI,
        functionName: 'treasury',
      },
      {
        address: registryAddress,
        abi: ProtocolRegistryABI,
        functionName: 'protocolCount',
      },
      {
        address: registryAddress,
        abi: ProtocolRegistryABI,
        functionName: 'getTotalValueLocked',
      },
      {
        address: registryAddress,
        abi: ProtocolRegistryABI,
        functionName: 'getActiveProtocols',
      },
    ],
  });

  const [admin, treasury, protocolCount, totalValueLocked, activeProtocols] = data || [];
  const useGetProtocol = (protocolAddress: `0x${string}`) => {
    return useReadContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'getProtocol',
      args: [protocolAddress],
    });
  };

  const useGetProtocolsByRisk = (riskLevel: number) => {
    return useReadContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'getProtocolsByRisk',
      args: [riskLevel],
    });
  };

  // READ: Get Protocol Stats
  const useGetProtocolStats = (protocolAddress: `0x${string}`) => {
    return useReadContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'getProtocolStats',
      args: [protocolAddress],
    });
  };

  const useIsProtocolActive = (protocolAddress: `0x${string}`) => {
    return useReadContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'isProtocolActive',
      args: [protocolAddress],
    });
  };

  const addDeFiProtocol = (
    protocolAddress: `0x${string}`,
    name: string,
    apy: bigint,
    riskLevel: number
  ) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'addDeFiProtocol',
      args: [protocolAddress, name, apy, riskLevel],
    });
  };

  const updateProtocolAPY = (protocolAddress: `0x${string}`, newAPY: bigint) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'updateProtocolAPY',
      args: [protocolAddress, newAPY],
    });
  };

  const toggleProtocolStatus = (protocolAddress: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'toggleProtocolStatus',
      args: [protocolAddress],
    });
  };

  const removeProtocol = (protocolAddress: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'removeProtocol',
      args: [protocolAddress],
    });
  };

  const updateTotalDeposited = (protocolAddress: `0x${string}`, amount: bigint) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'updateTotalDeposited',
      args: [protocolAddress, amount],
    });
  };

  const setTreasury = (treasuryAddress: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'setTreasury',
      args: [treasuryAddress],
    });
  };

  const addAuthorizedManager = (manager: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'addAuthorizedManager',
      args: [manager],
    });
  };

  const removeAuthorizedManager = (manager: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'removeAuthorizedManager',
      args: [manager],
    });
  };

  const changeAdmin = (newAdmin: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: ProtocolRegistryABI,
      functionName: 'changeAdmin',
      args: [newAdmin],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {

    admin: admin?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    protocolCount: protocolCount?.result as bigint | undefined,
    totalValueLocked: totalValueLocked?.result as bigint | undefined,
    activeProtocols: activeProtocols?.result as `0x${string}`[] | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,

    useGetProtocol,
    useGetProtocolsByRisk,
    useGetProtocolStats,
    useIsProtocolActive,

    addDeFiProtocol,
    updateProtocolAPY,
    toggleProtocolStatus,
    removeProtocol,
    updateTotalDeposited,
    setTreasury,
    addAuthorizedManager,
    removeAuthorizedManager,
    changeAdmin,
    refetch,
  };
}
