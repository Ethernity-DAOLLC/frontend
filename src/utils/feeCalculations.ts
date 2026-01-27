import { parseUnits, formatUnits } from 'viem';

export const FEE_PERCENTAGE = 3; // 3%
export const FEE_BASIS_POINTS = 300; // 3% en basis points
export const BASIS_POINTS_DIVISOR = 10000;
export function calculateFeeFromGross(grossAmount: bigint): bigint {
  return (grossAmount * BigInt(FEE_BASIS_POINTS)) / BigInt(BASIS_POINTS_DIVISOR);
}

export function calculateNetAmount(grossAmount: bigint): bigint {
  const fee = calculateFeeFromGross(grossAmount);
  return grossAmount - fee;
}

export function calculateGrossFromNet(netAmount: bigint): bigint {
  return (netAmount * BigInt(BASIS_POINTS_DIVISOR)) / BigInt(BASIS_POINTS_DIVISOR - FEE_BASIS_POINTS);
}

export interface DepositBreakdown {
  initialGross: bigint;      // Monto bruto del depósito inicial
  monthlyGross: bigint;      // Monto bruto del depósito mensual
  totalGross: bigint;        // Total que el usuario debe aprobar/transferir

  initialFee: bigint;        // Fee sobre el depósito inicial
  monthlyFee: bigint;        // Fee sobre el depósito mensual
  totalFees: bigint;         // Total de fees

  initialNet: bigint;        // Neto del inicial que va al fondo
  monthlyNet: bigint;        // Neto del mensual que va al fondo
  totalNet: bigint;          // Total neto en el fondo
}

export function calculateDepositBreakdown(
  initialDeposit: bigint,
  monthlyDeposit: bigint
): DepositBreakdown {
  const initialFee = calculateFeeFromGross(initialDeposit);
  const monthlyFee = calculateFeeFromGross(monthlyDeposit);
  const initialNet = initialDeposit - initialFee;
  const monthlyNet = monthlyDeposit - monthlyFee;
  
  return {
    initialGross: initialDeposit,
    monthlyGross: monthlyDeposit,
    totalGross: initialDeposit + monthlyDeposit,

    initialFee,
    monthlyFee,
    totalFees: initialFee + monthlyFee,

    initialNet,
    monthlyNet,
    totalNet: initialNet + monthlyNet,
  };
}

export interface RequiredBalances {
  usdcRequired: bigint;      // Total USDC necesario
  gasRequired: bigint;       // Gas estimado necesario
  breakdown: DepositBreakdown;
}

export function calculateRequiredBalances(
  initialDeposit: bigint,
  monthlyDeposit: bigint,
  estimatedGasInWei: bigint = parseUnits('0.005', 18) 
): RequiredBalances {
  const breakdown = calculateDepositBreakdown(initialDeposit, monthlyDeposit);
  
  return {
    usdcRequired: breakdown.totalGross,
    gasRequired: estimatedGasInWei,
    breakdown,
  };
}

export interface FormattedBreakdown {
  initialGross: string;
  monthlyGross: string;
  totalGross: string;
  
  initialFee: string;
  monthlyFee: string;
  totalFees: string;
  
  initialNet: string;
  monthlyNet: string;
  totalNet: string;
}

export function formatBreakdown(
  breakdown: DepositBreakdown,
  decimals: number = 6
): FormattedBreakdown {
  const format = (amount: bigint) => formatUnits(amount, decimals);
  
  return {
    initialGross: format(breakdown.initialGross),
    monthlyGross: format(breakdown.monthlyGross),
    totalGross: format(breakdown.totalGross),
    
    initialFee: format(breakdown.initialFee),
    monthlyFee: format(breakdown.monthlyFee),
    totalFees: format(breakdown.totalFees),
    
    initialNet: format(breakdown.initialNet),
    monthlyNet: format(breakdown.monthlyNet),
    totalNet: format(breakdown.totalNet),
  };
}

export function formatUSD(amount: bigint, decimals: number = 6): string {
  const value = formatUnits(amount, decimals);
  const num = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export interface BalanceValidation {
  hasEnoughUSDC: boolean;
  hasEnoughGas: boolean;
  usdcShortfall: bigint;     // Cuánto le falta de USDC
  gasShortfall: bigint;      // Cuánto le falta de gas
  isValid: boolean;          // true si tiene todo lo necesario
}

export function validateBalance(
  userUSDCBalance: bigint,
  userGasBalance: bigint,
  required: RequiredBalances
): BalanceValidation {
  const hasEnoughUSDC = userUSDCBalance >= required.usdcRequired;
  const hasEnoughGas = userGasBalance >= required.gasRequired;
  
  return {
    hasEnoughUSDC,
    hasEnoughGas,
    usdcShortfall: hasEnoughUSDC ? 0n : required.usdcRequired - userUSDCBalance,
    gasShortfall: hasEnoughGas ? 0n : required.gasRequired - userGasBalance,
    isValid: hasEnoughUSDC && hasEnoughGas,
  };
}

export function runFeeCalculationTests() {
  console.log('🧪 Running fee calculation tests...');

  const amount1 = parseUnits('1000', 6);
  const fee1 = calculateFeeFromGross(amount1);
  const expected1 = parseUnits('30', 6);
  console.assert(fee1 === expected1, `Fee test 1 failed: ${formatUnits(fee1, 6)} !== 30`);

  const net1 = calculateNetAmount(amount1);
  const expectedNet1 = parseUnits('970', 6);
  console.assert(net1 === expectedNet1, `Net test 1 failed: ${formatUnits(net1, 6)} !== 970`);
  const desiredNet = parseUnits('1000', 6);
  const requiredGross = calculateGrossFromNet(desiredNet);
  const actualNet = calculateNetAmount(requiredGross);
  console.assert(actualNet >= desiredNet, `Gross from net test failed`);
  console.log('✅ All fee calculation tests passed');
  console.log(`   1000 USDC gross → ${formatUnits(net1, 6)} net (fee: ${formatUnits(fee1, 6)})`);
  console.log(`   1000 USDC net ← ${formatUnits(requiredGross, 6)} gross required`);
}

// Descomentar para ejecutar tests:
// runFeeCalculationTests();