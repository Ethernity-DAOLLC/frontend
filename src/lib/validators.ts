export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateAge = (age: number): ValidationResult => {
  if (!age || age < 18) {
    return { isValid: false, error: 'Debes tener al menos 18 años' };
  }
  if (age > 100) {
    return { isValid: false, error: 'Edad no válida' };
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
      error: 'La edad de retiro debe ser mayor a tu edad actual' 
    };
  }
  if (retirementAge - currentAge < 5) {
    return { 
      isValid: false, 
      error: 'Debes tener al menos 5 años hasta el retiro' 
    };
  }
  if (retirementAge > 100) {
    return { isValid: false, error: 'Edad de retiro no válida' };
  }
  return { isValid: true };
};

export const validateAmount = (
  amount: number,
  min?: number,
  max?: number
): ValidationResult => {
  if (isNaN(amount) || amount < 0) {
    return { isValid: false, error: 'Monto inválido' };
  }
  if (min !== undefined && amount < min) {
    return { isValid: false, error: `Monto mínimo: $${min}` };
  }
  if (max !== undefined && amount > max) {
    return { isValid: false, error: `Monto máximo: $${max}` };
  }
  return { isValid: true };
};

export const validateInterestRate = (rate: number): ValidationResult => {
  if (isNaN(rate) || rate < 0) {
    return { isValid: false, error: 'Tasa inválida' };
  }
  if (rate > 100) {
    return { isValid: false, error: 'Tasa máxima: 100%' };
  }
  return { isValid: true };
};