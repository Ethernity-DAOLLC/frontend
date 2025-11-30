import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const USDC_DECIMALS = 6;

export function useUSDC() {
  const [isApproving, setIsApproving] = useState(false);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const useBalance = (address?: `0x${string}`) => {
    return useReadContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    });
  };
  const useAllowance = (owner?: `0x${string}`, spender?: `0x${string}`) => {
    return useReadContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: owner && spender ? [owner, spender] : undefined,
    });
  };
  const approve = async (spender: `0x${string}`, amount: string) => {
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
  };
  const formatUSDC = (amount: bigint | undefined): string => {
    if (!amount) return '0';
    return formatUnits(amount, USDC_DECIMALS);
  };
  const parseUSDC = (amount: string): bigint => {
    return parseUnits(amount, USDC_DECIMALS);
  };
  return {
    address: USDC_ADDRESS,
    decimals: USDC_DECIMALS,
    useBalance,
    useAllowance,
    approve,
    formatUSDC,
    parseUSDC,
    isApproving: isApproving || isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}