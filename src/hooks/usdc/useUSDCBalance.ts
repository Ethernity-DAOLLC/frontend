import { useReadContract } from 'wagmi';
import { type Address } from 'viem';

const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as Address;

interface UseUSDCBalanceReturn {
  data: bigint;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUSDCBalance(address?: Address): UseUSDCBalanceReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESS,
      refetchInterval: 10000, 
    },
  });

  return {
    data: (data as bigint) || 0n,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}