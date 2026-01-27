import { useAccount, useReadContract, useBalance, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { getContractAddress } from '@/config/addresses';
import { USDC_ADDRESSES, ERC20_ABI } from '@/config/tokens';
import { 
  calculateRequiredBalances,
  validateBalance,
  type RequiredBalances,
  type BalanceValidation,
  type DepositBreakdown
} from '@/utils/feeCalculations';
import type { RetirementPlan } from '@/types/retirement_types';

export interface BalanceCheck {
  hasEnoughUSDC: boolean;
  hasEnoughGas: boolean;
  hasEnoughAllowance: boolean;
  usdcBalance: bigint;
  gasBalance: bigint;
  allowance: bigint;
  usdcRequired: bigint;
  gasRequired: bigint;
  breakdown: DepositBreakdown | null;
  validation: BalanceValidation | null;
  isLoading: boolean;
  chainId: number;
  usdcAddress: `0x${string}` | undefined;
  factoryAddress: `0x${string}` | undefined;
}

export function useBalanceVerification(plan: RetirementPlan | null): BalanceCheck {
  const { address } = useAccount();
  const chainId = useChainId();
  const usdcAddress = USDC_ADDRESSES[chainId];
  const factoryAddress = getContractAddress(chainId, 'personalFundFactory');
  const initialDeposit = plan ? parseUnits(plan.initialDeposit.toString(), 6) : 0n;
  const monthlyDeposit = plan ? parseUnits(plan.monthlyDeposit.toString(), 6) : 0n;
  const required: RequiredBalances | null = plan 
    ? calculateRequiredBalances(initialDeposit, monthlyDeposit)
    : null;
  const { data: usdcBalance = 0n, isLoading: isLoadingUSDC } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
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
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && factoryAddress 
      ? [address, factoryAddress] 
      : undefined,
    query: {
      enabled: !!address && !!factoryAddress && !!usdcAddress
    }
  });
  const gasBalance = gasBalanceData?.value ?? 0n;
  const validation: BalanceValidation | null = required
    ? validateBalance(usdcBalance, gasBalance, required)
    : null;
  const hasEnoughAllowance = required 
    ? allowance >= required.usdcRequired
    : false;

  return {
    hasEnoughUSDC: validation?.hasEnoughUSDC ?? false,
    hasEnoughGas: validation?.hasEnoughGas ?? false,
    hasEnoughAllowance,
    usdcBalance,
    gasBalance,
    allowance,
    usdcRequired: required?.usdcRequired ?? 0n,
    gasRequired: required?.gasRequired ?? 0n,
    breakdown: required?.breakdown ?? null,
    validation,
    isLoading: isLoadingUSDC || isLoadingGas || isLoadingAllowance,
    chainId,
    usdcAddress,
    factoryAddress,
  };
}

export function useCanProceed(plan: RetirementPlan | null): {
  canProceed: boolean;
  reason: string | null;
  isLoading: boolean;
} {
  const check = useBalanceVerification(plan);
  
  if (check.isLoading) {
    return { canProceed: false, reason: 'Loading...', isLoading: true };
  }
  
  if (!check.hasEnoughUSDC) {
    return { 
      canProceed: false, 
      reason: 'Insufficient USDC balance', 
      isLoading: false 
    };
  }
  
  if (!check.hasEnoughGas) {
    return { 
      canProceed: false, 
      reason: 'Insufficient gas balance', 
      isLoading: false 
    };
  }
  
  return { canProceed: true, reason: null, isLoading: false };
}