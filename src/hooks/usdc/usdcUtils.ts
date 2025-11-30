import { formatUnits, parseUnits } from 'viem';

export const USDC_DECIMALS = 6;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
export function formatUSDC(amount: bigint | undefined): string {
  if (!amount) return '0.00';
  return parseFloat(formatUnits(amount, USDC_DECIMALS)).toFixed(2);
}

export function parseUSDC(amount: string | number): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  return parseUnits(amountStr, USDC_DECIMALS);
}

export function needsApproval(
  currentAllowance: bigint | undefined,
  requiredAmount: bigint
): boolean {
  if (!currentAllowance) return true;
  return currentAllowance < requiredAmount;
}

export function formatUSDCWithSymbol(amount: bigint | undefined): string {
  return `$${formatUSDC(amount)} USDC`;
}

export function isValidUSDCAmount(amount: string): boolean {
  if (!amount || amount.trim() === '') return false;
  
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  
  const parts = amount.split('.');
  if (parts.length > 2) return false;
  if (parts.length === 2 && parts[1].length > USDC_DECIMALS) return false;
  
  return true;
}