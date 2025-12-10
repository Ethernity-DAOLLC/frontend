export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateAge = (age: number): ValidationResult => {
  if (!age || age < 18) {
    return { isValid: false, error: 'You must be at least 18 years old' };
  }
  if (age > 100) {
    return { isValid: false, error: 'Invalid age' };
  }
  return { isValid: true };
};

export const validateRetirementAge = (
  currentAge: number,
  retirementAge: number
): ValidationResult => {
  if (retirementAge <= currentAge) {
    return { 
      isValid: false, 
      error: 'Retirement age must be greater than your current age' 
    };
  }
  if (retirementAge - currentAge < 5) {
    return { 
      isValid: false, 
      error: 'You must have at least 5 years until retirement' 
    };
  }
  if (retirementAge > 100) {
    return { isValid: false, error: 'Invalid retirement age' };
  }
  return { isValid: true };
};

export const validateAmount = (
  amount: number,
  min?: number,
  max?: number
): ValidationResult => {
  if (isNaN(amount) || amount < 0) {
    return { isValid: false, error: 'Invalid amount' };
  }
  if (min !== undefined && amount < min) {
    return { isValid: false, error: `Minimum amount: $${min}` };
  }
  if (max !== undefined && amount > max) {
    return { isValid: false, error: `Maximum amount: $${max}` };
  }
  return { isValid: true };
};

export const validateInterestRate = (rate: number): ValidationResult => {
  if (isNaN(rate) || rate < 0) {
    return { isValid: false, error: 'Invalid rate' };
  }
  if (rate > 100) {
    return { isValid: false, error: 'Maximum rate: 100%' };
  }
  return { isValid: true };
};
