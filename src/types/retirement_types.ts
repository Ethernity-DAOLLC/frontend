export interface RetirementPlan {
  principal: number;
  initialDeposit: number;
  monthlyDeposit: number;
  currentAge: number;
  retirementAge: number;
  desiredMonthlyIncome: number;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}

export type Network = 'arbitrum-sepolia' | 'polygon-amoy';
export interface BalanceCheck {
  hasEnoughUSDC: boolean;
  hasEnoughGas: boolean;
  hasEnoughAllowance: boolean;
  usdcBalance: bigint;
  gasBalance: bigint;
  allowance: bigint;
  requiredUSDC: bigint;
  requiredGas: bigint;
  isLoading: boolean;
}

export interface TransactionStep {
  step: 'idle' | 'checking' | 'approving' | 'approved' | 'executing' | 'confirming' | 'success' | 'error';
  progress: number;
  message: string | null;
}