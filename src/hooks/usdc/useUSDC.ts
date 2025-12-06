import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const USDC_DECIMALS = 6;

export function useUSDC() {
  const [isApproving, setIsApproving] = useState(false);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const formatUSDC = useCallback((amount: bigint | undefined): string => {
    if (!amount) return '0';
    return formatUnits(amount, USDC_DECIMALS);
  }, []);

  const parseUSDC = useCallback((amount: string): bigint => {
    return parseUnits(amount, USDC_DECIMALS);
  }, []);

  const approve = useCallback(async (spender: `0x${string}`, amount: string) => {
    setIsApproving(true);
    try {
      const amountInWei = parseUnits(amount, USDC_DECIMALS);
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amountInWei],
      });
    } catch (error) {
      console.error('Approval error:', error);
      setIsApproving(false);
      throw error;
    }
  }, [writeContract]);

  return {
    address: USDC_ADDRESS,
    decimals: USDC_DECIMALS,
    approve,
    formatUSDC,
    parseUSDC,
    isApproving: isApproving || isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

export function useUSDCBalance(address?: `0x${string}`) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useUSDCAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });
}