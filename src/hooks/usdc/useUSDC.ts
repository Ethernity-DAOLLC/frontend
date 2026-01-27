import { useState, useCallback } from 'react';
import { useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { erc20Abi } from 'viem';
import { useUSDCAddress } from './usdcUtils';
import { useWriteContractWithGas } from '@/hooks/gas/useWriteContractWithGas';

const USDC_DECIMALS = 6;

export function useUSDC() {
  const USDC_ADDRESS = useUSDCAddress();
  const [isApproving, setIsApproving] = useState(false);
  const { writeContract, data: hash, isPending } = useWriteContractWithGas();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const formatUSDC = useCallback((amount: bigint | undefined): string => {
    if (!amount) return '0';
    return formatUnits(amount, USDC_DECIMALS);
  }, []);

  const parseUSDC = useCallback((amount: string): bigint => {
    return parseUnits(amount, USDC_DECIMALS);
  }, []);

  const approve = useCallback(async (spender: Address, amount: string) => {
    if (!USDC_ADDRESS) {
      throw new Error('USDC address not available for this network');
    }

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
  }, [USDC_ADDRESS, writeContract]);

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

export function useUSDCBalance(address?: Address) {
  const USDC_ADDRESS = useUSDCAddress();
  const { address: account } = useAccount();
  
  return useReadContract({
    address: USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    account: account!,
    query: {
      enabled: Boolean(address && USDC_ADDRESS),
    },
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; error: Error | null; refetch: () => void };
}

export function useUSDCAllowance(owner?: Address, spender?: Address) {
  const USDC_ADDRESS = useUSDCAddress();
  const { address: account } = useAccount();
  
  return useReadContract({
    address: USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    account: account!,
    query: {
      enabled: Boolean(owner && spender && USDC_ADDRESS),
    },
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; error: Error | null; refetch: () => void };
}

export function useUSDCSymbol() {
  const USDC_ADDRESS = useUSDCAddress();
  const { address: account } = useAccount();
  
  return useReadContract({
    address: USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'symbol',
    account,
    query: {
      enabled: Boolean(USDC_ADDRESS),
    },
  }) as { data: string | undefined; isLoading: boolean; isError: boolean; error: Error | null };
}

export function useUSDCName() {
  const USDC_ADDRESS = useUSDCAddress();
  const { address: account } = useAccount();
  
  return useReadContract({
    address: USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'name',
    account,
    query: {
      enabled: Boolean(USDC_ADDRESS),
    },
  }) as { data: string | undefined; isLoading: boolean; isError: boolean; error: Error | null };
}

export function useUSDCDecimals() {
  const USDC_ADDRESS = useUSDCAddress();
  const { address: account } = useAccount();
  
  return useReadContract({
    address: USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'decimals',
    account,
    query: {
      enabled: Boolean(USDC_ADDRESS),
    },
  }) as { data: number | undefined; isLoading: boolean; isError: boolean; error: Error | null };
}

export function useUSDCTotalSupply() {
  const USDC_ADDRESS = useUSDCAddress();
  const { address: account } = useAccount();
  
  return useReadContract({
    address: USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'totalSupply',
    account,
    query: {
      enabled: Boolean(USDC_ADDRESS),
    },
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; error: Error | null };
}

export function useUSDCInfo() {
  const address = useUSDCAddress();
  const { data: symbol } = useUSDCSymbol();
  const { data: name } = useUSDCName();
  const { data: decimals } = useUSDCDecimals();
  const { data: totalSupply } = useUSDCTotalSupply();
  
  return {
    address,
    symbol,
    name,
    decimals,
    totalSupply,
  };
}