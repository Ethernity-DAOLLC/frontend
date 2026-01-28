import type { RetirementPlan } from '@/types/retirement_types';

export function safeParseNumber(value: any, defaultValue: number = 0): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? defaultValue : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

export function validateRetirementPlan(plan: any): RetirementPlan | null {
  if (!plan || typeof plan !== 'object') {
    console.error('❌ Invalid plan: plan is not an object', plan);
    return null;
  }

  try {
    const validated: RetirementPlan = {
      principal: safeParseNumber(plan.principal, 0),
      initialDeposit: safeParseNumber(plan.initialDeposit, 0),
      monthlyDeposit: safeParseNumber(plan.monthlyDeposit, 0),
      currentAge: safeParseNumber(plan.currentAge, 25),
      retirementAge: safeParseNumber(plan.retirementAge, 65),
      desiredMonthlyIncome: safeParseNumber(plan.desiredMonthlyIncome, 0),
      yearsPayments: safeParseNumber(plan.yearsPayments, 20),
      interestRate: safeParseNumber(plan.interestRate, 5),
      timelockYears: safeParseNumber(plan.timelockYears, 1),
    };

    if (validated.initialDeposit === 0) {
      console.error('❌ Invalid plan: initialDeposit is 0', plan);
      return null;
    }

    if (validated.retirementAge <= validated.currentAge) {
      console.error('❌ Invalid plan: retirementAge must be greater than currentAge', plan);
      return null;
    }

    return validated;
  } catch (error) {
    console.error('❌ Error validating plan:', error, plan);
    return null;
  }
}

export function planToDisplayFormat(plan: RetirementPlan): {
  principal: string;
  initialDeposit: string;
  monthlyDeposit: string;
  currentAge: string;
  retirementAge: string;
  desiredMonthlyIncome: string;
  yearsPayments: string;
  interestRate: string;
  timelockYears: string;
} {
  return {
    principal: plan.principal.toString(),
    initialDeposit: plan.initialDeposit.toString(),
    monthlyDeposit: plan.monthlyDeposit.toString(),
    currentAge: plan.currentAge.toString(),
    retirementAge: plan.retirementAge.toString(),
    desiredMonthlyIncome: plan.desiredMonthlyIncome.toString(),
    yearsPayments: plan.yearsPayments.toString(),
    interestRate: plan.interestRate.toString(),
    timelockYears: plan.timelockYears.toString(),
  };
}

export function isPlanValid(plan: any): plan is RetirementPlan {
  if (!plan || typeof plan !== 'object') return false;

  const requiredFields = [
    'principal',
    'initialDeposit',
    'monthlyDeposit',
    'currentAge',
    'retirementAge',
    'desiredMonthlyIncome',
    'yearsPayments',
    'interestRate',
    'timelockYears',
  ];

  for (const field of requiredFields) {
    if (!(field in plan)) {
      console.error(`❌ Missing field in plan: ${field}`);
      return false;
    }
  }

  const initialDeposit = safeParseNumber(plan.initialDeposit);
  if (initialDeposit <= 0) {
    console.error('❌ Invalid initialDeposit:', plan.initialDeposit);
    return false;
  }

  const currentAge = safeParseNumber(plan.currentAge);
  const retirementAge = safeParseNumber(plan.retirementAge);
  if (retirementAge <= currentAge) {
    console.error('❌ Invalid ages:', { currentAge, retirementAge });
    return false;
  }

  return true;
}