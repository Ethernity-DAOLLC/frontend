import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddress, type ContractName } from '@/config/contracts';
import { Abi } from 'viem';

export function useContractRead<T = unknown>(
  contractName: ContractName,
  abi: Abi,
  functionName: string,
  args?: unknown[]
) {
  const chainId = useChainId();
  const address = getContractAddress(chainId, contractName);

  return useReadContract({
    address,
    abi,
    functionName,
    args,
    query: {
      enabled: !!address && address !== '0x0000000000000000000000000000000000000000',
    },
  }) as { data: T | undefined; isLoading: boolean; error: Error | null; refetch: () => void };
}

export function useContractWrite(contractName: ContractName, abi: Abi) {
  const chainId = useChainId();
  const address = getContractAddress(chainId, contractName);

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const write = (functionName: string, args?: unknown[]) => {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
    }

    return writeContract({
      address,
      abi,
      functionName,
      args,
    });
  };

  return {
    write,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useContractAddress(contractName: ContractName) {
  const chainId = useChainId();
  return getContractAddress(chainId, contractName);
}