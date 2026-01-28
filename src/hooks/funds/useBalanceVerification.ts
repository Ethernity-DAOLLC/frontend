import { useAccount, useReadContract, useBalance, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { getContractAddress } from '@/config/addresses';
import type { BalanceCheck, RetirementPlan } from '@/types/retirement_types';

const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const;

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  421614: '0x53E691B568B87f0124bb3A88C8b9958bF8396E81', // Arbitrum Sepolia
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',  // Polygon Amoy
};

export function useBalanceVerification(plan: RetirementPlan | null): BalanceCheck {
  const { address } = useAccount();
  const chainId = useChainId();
  const usdcAddress = USDC_ADDRESSES[chainId];
  const factoryAddress = getContractAddress(chainId, 'personalFundFactory');

  if (!plan) {
    console.warn('⚠️ useBalanceVerification: plan is null or undefined');
    return {
      hasEnoughUSDC: false,
      hasEnoughGas: false,
      hasEnoughAllowance: false,
      usdcBalance: 0n,
      gasBalance: 0n,
      allowance: 0n,
      requiredUSDC: 0n,
      requiredGas: 0n,
      isLoading: false,
    };
  }

  let depositAmount: bigint;
  try {
    const depositValue = typeof plan.initialDeposit === 'number' 
      ? plan.initialDeposit 
      : typeof plan.initialDeposit === 'string'
      ? parseFloat(plan.initialDeposit)
      : 0;

    if (isNaN(depositValue) || depositValue <= 0) {
      console.error('❌ Invalid initialDeposit:', plan.initialDeposit, '→ Using 0');
      depositAmount = 0n;
    } else {
      depositAmount = parseUnits(depositValue.toFixed(2), 6);
    }
  } catch (error) {
    console.error('❌ Error parsing initialDeposit:', error, plan);
    depositAmount = 0n;
  }

  const feeAmount = (depositAmount * 3n) / 100n;
  const totalRequired = depositAmount;
  const { data: usdcBalance = 0n, isLoading: isLoadingUSDC } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress
    }
  });

  const { data: gasBalanceData, isLoading: isLoadingGas } = useBalance({
    address: address,
    query: {
      enabled: !!address
    }
  });

  const { data: allowance = 0n, isLoading: isLoadingAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && factoryAddress 
      ? [address, factoryAddress] 
      : undefined,
    query: {
      enabled: !!address && !!factoryAddress && !!usdcAddress
    }
  });

  const gasBalance = gasBalanceData?.value ?? 0n;
  const minGasRequired = parseUnits('0.005', 18); 

  return {
    hasEnoughUSDC: usdcBalance >= totalRequired,
    hasEnoughGas: gasBalance >= minGasRequired,
    hasEnoughAllowance: allowance >= totalRequired,
    usdcBalance: usdcBalance,
    gasBalance: gasBalance,
    allowance: allowance,
    requiredUSDC: totalRequired,
    requiredGas: minGasRequired,
    isLoading: isLoadingUSDC || isLoadingGas || isLoadingAllowance
  };
}