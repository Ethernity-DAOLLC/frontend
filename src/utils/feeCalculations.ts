export const FEE_PERCENTAGE = 3;
export const FEE_BASIS_POINTS = 300; 
export function calculateFee(grossAmount: bigint): bigint {
  return (grossAmount * BigInt(FEE_PERCENTAGE)) / 100n;
}

export function calculateNetAmount(grossAmount: bigint): bigint {
  return grossAmount - calculateFee(grossAmount);
}

export function calculateGrossFromNet(netAmount: bigint): bigint {
  return (netAmount * 100n) / 97n;
}

export function calculateTotalRequired(depositAmount: bigint): bigint {
  return depositAmount;
}

export function hasEnoughBalanceWithFees(balance: bigint, requiredAmount: bigint): boolean {
  const totalRequired = calculateTotalRequired(requiredAmount);
  return balance >= totalRequired;
}

export interface DepositBreakdown {
  grossAmount: bigint;  
  feeAmount: bigint;  
  netAmount: bigint;  
  feePercentage: number; 
}

export function calculateDepositBreakdown(grossAmount: bigint): DepositBreakdown {
  const feeAmount = calculateFee(grossAmount);
  const netAmount = calculateNetAmount(grossAmount);
  
  return {
    grossAmount,
    feeAmount,
    netAmount,
    feePercentage: FEE_PERCENTAGE,
  };
}

export function formatDepositBreakdown(
  breakdown: DepositBreakdown,
  formatter: (amount: bigint) => string
): {
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  feePercentage: string;
} {
  return {
    grossAmount: formatter(breakdown.grossAmount),
    feeAmount: formatter(breakdown.feeAmount),
    netAmount: formatter(breakdown.netAmount),
    feePercentage: `${breakdown.feePercentage}%`,
  };
}

export function isValidDepositAmount(
  amount: bigint,
  minAmount?: bigint,
  maxAmount?: bigint
): boolean {
  if (amount <= 0n) return false;
  if (minAmount && amount < minAmount) return false;
  if (maxAmount && amount > maxAmount) return false;
  return true;
}

export const MIN_DEPOSIT = 100n * 1_000_000n; 
export const MIN_PRINCIPAL = 1000n * 1_000_000n; 
export function calculateInitialDeposit(
  principal: bigint,
  monthlyDeposit: bigint
): bigint {
  return principal + monthlyDeposit;
}

export function shouldHavePrincipal(
  currentAge: number,
  retirementAge: number
): boolean {
  const yearsToRetirement = retirementAge - currentAge;
  if (yearsToRetirement < 15) return true;
  if (currentAge >= 40) return true;
  return false;
}

export interface InitialDepositBreakdown extends DepositBreakdown {
  principal: bigint;
  firstMonthlyDeposit: bigint;
  hasPrincipal: boolean;
}

export function calculateInitialDepositBreakdown(
  principal: bigint,
  monthlyDeposit: bigint
): InitialDepositBreakdown {
  const totalGross = calculateInitialDeposit(principal, monthlyDeposit);
  const baseBreakdown = calculateDepositBreakdown(totalGross);
  
  return {
    ...baseBreakdown,
    principal,
    firstMonthlyDeposit: monthlyDeposit,
    hasPrincipal: principal > 0n,
  };
}

export function calculateShortfall(currentBalance: bigint, requiredAmount: bigint): bigint {
  if (currentBalance >= requiredAmount) return 0n;
  return requiredAmount - currentBalance;
}

export function calculateFeeUSD(grossAmountUSD: number): number {
  return grossAmountUSD * (FEE_PERCENTAGE / 100);
}

export function calculateNetAmountUSD(grossAmountUSD: number): number {
  return grossAmountUSD - calculateFeeUSD(grossAmountUSD);
}

export interface DepositValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  breakdown?: DepositBreakdown;
}

export function validateDeposit(
  amount: bigint,
  userBalance: bigint,
  options?: {
    minAmount?: bigint;
    maxAmount?: bigint;
    checkBalance?: boolean;
  }
): DepositValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (amount <= 0n) {
    errors.push('El monto debe ser mayor a 0');
  }

  if (options?.minAmount && amount < options.minAmount) {
    errors.push(`El monto mínimo es ${options.minAmount.toString()} wei`);
  }

  if (options?.maxAmount && amount > options.maxAmount) {
    errors.push(`El monto máximo es ${options.maxAmount.toString()} wei`);
  }

  if (options?.checkBalance !== false) {
    const totalRequired = calculateTotalRequired(amount);
    if (userBalance < totalRequired) {
      errors.push(`Balance insuficiente. Necesitas ${totalRequired.toString()} wei`);
    }
  }

  const breakdown = calculateDepositBreakdown(amount);
  if (breakdown.feeAmount > 100n * 1_000_000n) { 
    warnings.push(`El fee será de ${breakdown.feeAmount.toString()} wei (${FEE_PERCENTAGE}%)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    breakdown,
  };
}