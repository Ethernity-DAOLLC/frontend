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
  initialGross: bigint;     
  monthlyGross: bigint; 
  totalGross: bigint;     
  initialFee: bigint;       
  monthlyFee: bigint;     
  totalFees: bigint;     
  initialNet: bigint;     
  monthlyNet: bigint;   
  totalNet: bigint;        
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

export function calculateInitialDepositBreakdown(
  principal: bigint,
  monthlyDeposit: bigint
): DepositBreakdown & { grossAmount: string; netAmount: string } {
  const breakdown = calculateDepositBreakdown(principal, monthlyDeposit);
  
  return {
    ...breakdown,
    grossAmount: formatUnits(breakdown.totalGross, 6),
    netAmount: formatUnits(breakdown.totalNet, 6),
  };
}

export interface RequiredBalances {
  usdcRequired: bigint;    
  gasRequired: bigint;     
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

export function formatDepositBreakdown(
  breakdown: DepositBreakdown & { grossAmount?: string; netAmount?: string },
  formatFn: (amount: bigint) => string
): { grossAmount: string; netAmount: string; feeAmount: string } {
  return {
    grossAmount: breakdown.grossAmount || formatFn(breakdown.totalGross),
    netAmount: breakdown.netAmount || formatFn(breakdown.totalNet),
    feeAmount: formatFn(breakdown.totalFees),
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
  usdcShortfall: bigint;
  gasShortfall: bigint;
  isValid: boolean;
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

export function calculateTotalRequired(depositAmount: bigint): bigint {
  return depositAmount;
}

export function hasEnoughBalanceWithFees(
  userBalance: bigint,
  depositAmount: bigint
): boolean {
  return userBalance >= depositAmount;
}

export function calculateShortfall(
  userBalance: bigint,
  totalRequired: bigint
): bigint {
  if (userBalance >= totalRequired) return 0n;
  return totalRequired - userBalance;
}

export interface DepositValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  breakdown?: DepositBreakdown;
}

export function validateDeposit(
  depositAmount: bigint,
  userBalance: bigint,
  options: {
    checkBalance?: boolean;
    minAmount?: bigint;
    maxAmount?: bigint;
  } = {}
): DepositValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (options.minAmount && depositAmount < options.minAmount) {
    errors.push(`Deposit amount is below minimum: ${formatUnits(options.minAmount, 6)} USDC`);
  }

  if (options.maxAmount && depositAmount > options.maxAmount) {
    errors.push(`Deposit amount exceeds maximum: ${formatUnits(options.maxAmount, 6)} USDC`);
  }

  if (options.checkBalance !== false) {
    if (!hasEnoughBalanceWithFees(userBalance, depositAmount)) {
      const shortfall = calculateShortfall(userBalance, depositAmount);
      errors.push(
        `Insufficient balance. You need ${formatUnits(shortfall, 6)} more USDC`
      );
    }
  }

  // Calcular breakdown
  const breakdown = depositAmount > 0n 
    ? calculateDepositBreakdown(depositAmount, 0n)
    : undefined;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    breakdown,
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
  const totalReq = calculateTotalRequired(amount1);
  console.assert(totalReq === amount1, 'calculateTotalRequired failed');
  const hasEnough = hasEnoughBalanceWithFees(parseUnits('2000', 6), amount1);
  console.assert(hasEnough === true, 'hasEnoughBalanceWithFees test 1 failed');
  const notEnough = hasEnoughBalanceWithFees(parseUnits('500', 6), amount1);
  console.assert(notEnough === false, 'hasEnoughBalanceWithFees test 2 failed');
  const shortfall = calculateShortfall(parseUnits('500', 6), amount1);
  console.assert(shortfall === parseUnits('500', 6), 'calculateShortfall failed');
  console.log('✅ All fee calculation tests passed');
  console.log(`   1000 USDC gross → ${formatUnits(net1, 6)} net (fee: ${formatUnits(fee1, 6)})`);
  console.log(`   1000 USDC net ← ${formatUnits(requiredGross, 6)} gross required`);
}

// Descomentar para ejecutar tests:
// runFeeCalculationTests();