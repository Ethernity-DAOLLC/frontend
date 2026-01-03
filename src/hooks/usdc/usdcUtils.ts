import { formatUnits, parseUnits } from 'viem';
import { useChainId } from 'wagmi';
import { getContractAddress } from '@/config/addresses';

export const USDC_DECIMALS = 6;
export function getUSDCAddress(chainId: number): `0x${string}` | undefined {
  return getContractAddress(chainId, 'usdc');
}
export function useUSDCAddress(): `0x${string}` | undefined {
  const chainId = useChainId();
  return getUSDCAddress(chainId);
}
export function getFaucetAddress(chainId: number): `0x${string}` | undefined {
  return getContractAddress(chainId, 'faucet');
}
export function useFaucetAddress(): `0x${string}` | undefined {
  const chainId = useChainId();
  return getFaucetAddress(chainId);
}
export function formatUSDC(amount: bigint | undefined): string {
  if (!amount) return '0.00';
  return parseFloat(formatUnits(amount, USDC_DECIMALS)).toFixed(2);
}
export function formatUSDCWithSymbol(amount: bigint | undefined): string {
  if (!amount) return '$0.00 USDC';
  const formatted = formatUSDC(amount);
  const number = parseFloat(formatted);
  return `$${number.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} USDC`;
}
export function formatUSDCDisplay(amount: bigint | undefined): string {
  if (!amount) return '0';
  const value = parseFloat(formatUnits(amount, USDC_DECIMALS));
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}
export function parseUSDC(amount: string | number): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  return parseUnits(amountStr, USDC_DECIMALS);
}
export function usdcToNumber(amount: bigint): number {
  return parseFloat(formatUnits(amount, USDC_DECIMALS));
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
export function needsApproval(
  currentAllowance: bigint | undefined,
  requiredAmount: bigint
): boolean {
  if (!currentAllowance) return true;
  return currentAllowance < requiredAmount;
}
export function hasEnoughBalance(
  balance: bigint | undefined,
  required: bigint
): boolean {
  if (!balance) return false;
  return balance >= required;
}
export function compareUSDC(a: bigint, b: bigint): number {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}
export function minUSDC(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}
export function maxUSDC(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
export function addUSDC(a: bigint, b: bigint): bigint {
  return a + b;
}
export function subtractUSDC(a: bigint, b: bigint): bigint {
  return a - b;
}
export function multiplyUSDC(amount: bigint, multiplier: number): bigint {
  return (amount * BigInt(Math.floor(multiplier * 100))) / BigInt(100);
}
export function percentageOfUSDC(amount: bigint, percentage: number): bigint {
  return (amount * BigInt(Math.floor(percentage * 100))) / BigInt(10000);
}
export function isUSDCAddress(address: string, chainId: number): boolean {
  const usdcAddr = getUSDCAddress(chainId);
  if (!usdcAddr) return false;
  return address.toLowerCase() === usdcAddr.toLowerCase();
}
export function isFaucetAddress(address: string, chainId: number): boolean {
  const faucetAddr = getFaucetAddress(chainId);
  if (!faucetAddr) return false;
  return address.toLowerCase() === faucetAddr.toLowerCase();
}
export const USDC_MIN_AMOUNT = parseUSDC('0.01');
export const USDC_MAX_AMOUNT = parseUSDC('1000000000');
export const USDC_PRESETS = {
  tiny: parseUSDC('10'),  
  small: parseUSDC('100'),  
  medium: parseUSDC('1000'), 
  large: parseUSDC('10000'),
  huge: parseUSDC('100000'),
} as const;

export type USDCPreset = keyof typeof USDC_PRESETS;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}` | undefined;
export const FAUCET_CONTRACT_ADDRESS = import.meta.env.VITE_FAUCET_CONTRACT_ADDRESS as `0x${string}` | undefined;