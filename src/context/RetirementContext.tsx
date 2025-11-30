import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RetirementPlanData {
  initialDeposit: string;
  monthlyDeposit: string;
  currentAge: number;
  retirementAge: number;
  desiredMonthlyIncome: number;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}

interface RetirementContextType {
  planData: RetirementPlanData | null;
  setPlanData: (data: RetirementPlanData) => void;
  clearPlanData: () => void;
}
const RetirementContext = createContext<RetirementContextType | undefined>(undefined);

export const RetirementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [planData, setPlanDataState] = useState<RetirementPlanData | null>(null);

  const setPlanData = (data: RetirementPlanData) => {
    setPlanDataState(data);
    localStorage.setItem('retirementPlan', JSON.stringify(data));
  };

  const clearPlanData = () => {
    setPlanDataState(null);
    localStorage.removeItem('retirementPlan');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('retirementPlan');
    if (saved) {
      try {
        setPlanDataState(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved plan:', e);
      }
    }
  }, []);

  return (
    <RetirementContext.Provider value={{ planData, setPlanData, clearPlanData }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirementPlan = () => {
  const context = useContext(RetirementContext);
  if (context === undefined) {
    throw new Error('useRetirementPlan must be used within a RetirementProvider');
  }
  return context;
};