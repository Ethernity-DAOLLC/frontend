import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { useWallet } from '@/hooks/web3/useWallet';
import { formatUnits } from 'viem';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const USDC_DECIMALS = 6;
const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

interface UseUSDCBalanceReturn {
  balanceRaw: bigint;
  balanceFormatted: string;
  balanceNumber: number;

  hasEnoughBalance: (requiredAmount: bigint) => boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  tokenAddress: `0x${string}`;
  decimals: number;
  symbol: string;
}

export function useUSDCBalance(): UseUSDCBalanceReturn {
  const { address, isConnected } = useWallet();
  const publicClient = usePublicClient();
  const [balanceRaw, setBalanceRaw] = useState<bigint>(0n);
  const [balanceFormatted, setBalanceFormatted] = useState<string>('0.00');
  const [balanceNumber, setBalanceNumber] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!isConnected || !address || !publicClient) {
      setBalanceRaw(0n);
      setBalanceFormatted('0.00');
      setBalanceNumber(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address],
      });

      setBalanceRaw(result);

      const formatted = formatUnits(result, USDC_DECIMALS);
      setBalanceFormatted(formatted);
      setBalanceNumber(parseFloat(formatted));

      console.log('✅ USDC Balance:', formatted);
    } catch (err: any) {
      console.error('❌ Error fetching USDC balance:', err);
      setError(err.message || 'Failed to fetch USDC balance');
      setBalanceRaw(0n);
      setBalanceFormatted('0.00');
      setBalanceNumber(0);
    } finally {
      setIsLoading(false);
    }
  };

  const hasEnoughBalance = (requiredAmount: bigint): boolean => {
    return balanceRaw >= requiredAmount;
  };

  useEffect(() => {
    fetchBalance();
  }, [isConnected, address, publicClient]);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, address]);

  return {
    balanceRaw,
    balanceFormatted,
    balanceNumber,
    hasEnoughBalance,
    isLoading,
    error,
    refetch: fetchBalance,
    tokenAddress: USDC_ADDRESS,
    decimals: USDC_DECIMALS,
    symbol: 'USDC',
  };
}