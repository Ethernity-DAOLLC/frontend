import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { useUSDCAddress } from './usdcUtils';

const USDC_DECIMALS = 6;

export function useUSDC() {
  const USDC_ADDRESS = useUSDCAddress();
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

export function useUSDCBalance(address?: `0x${string}`) {
  const USDC_ADDRESS = useUSDCAddress();
  
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!USDC_ADDRESS,
    },
  });
}
export function useUSDCAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
  const USDC_ADDRESS = useUSDCAddress();
  
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender && !!USDC_ADDRESS,
    },
  });
}
export function useUSDCSymbol() {
  const USDC_ADDRESS = useUSDCAddress();
  
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!USDC_ADDRESS,
    },
  });
}

export function useUSDCName() {
  const USDC_ADDRESS = useUSDCAddress();
  
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'name',
    query: {
      enabled: !!USDC_ADDRESS,
    },
  });
}

export function useUSDCDecimals() {
  const USDC_ADDRESS = useUSDCAddress();
  
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!USDC_ADDRESS,
    },
  });
}

export function useUSDCTotalSupply() {
  const USDC_ADDRESS = useUSDCAddress();
  
  return useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'totalSupply',
    query: {
      enabled: !!USDC_ADDRESS,
    },
  });
}

export function useUSDCInfo() {
  const address = useUSDCAddress();
  const { data: symbol } = useUSDCSymbol();
  const { data: name } = useUSDCName();
  const { data: decimals } = useUSDCDecimals();
  const { data: totalSupply } = useUSDCTotalSupply();

  return {
    address,
    symbol: symbol as string | undefined,
    name: name as string | undefined,
    decimals: decimals as number | undefined,
    totalSupply: totalSupply as bigint | undefined,
  };
}