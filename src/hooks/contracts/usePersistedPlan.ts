import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

export interface RetirementPlanData {
  initialDeposit: string
  monthlyDeposit: string
  currentAge: number
  retirementAge: number
  desiredMonthlyIncome: number
  yearsPayments: number
  interestRate: number
  timelockYears: number
}

export function usePersistedPlan() {
  const { address } = useAccount()
  const [planData, setPlanDataState] = useState<RetirementPlanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const getStorageKey = useCallback((userAddress: string) => {
    return `retirement-plan:${userAddress.toLowerCase()}`
  }, [])

  useEffect(() => {
    if (!address) {
      setIsLoading(false)
      setPlanDataState(null)
      return
    }

    if (!window.storage) {
      console.warn('⚠️ window.storage not available, persistence disabled')
      setIsLoading(false)
      return
    }

    const loadPlan = async () => {
      try {
        const key = getStorageKey(address)
        const result = await window.storage.get(key, false)
        
        if (result?.value) {
          const parsed = JSON.parse(result.value) as RetirementPlanData
          setPlanDataState(parsed)
          console.log('✅ Plan loaded from storage')
        }
      } catch (err) {
        console.log('ℹ️ No saved plan found or error loading:', err)
        setError(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlan()
  }, [address, getStorageKey])

  const setPlanData = useCallback(async (data: RetirementPlanData) => {
    if (!address) {
      console.error('❌ Cannot save plan: wallet not connected')
      setError('Wallet not connected')
      return false
    }

    if (!window.storage) {
      console.error('❌ Cannot save plan: storage not available')
      setError('Storage not available')
      return false
    }

    try {
      const key = getStorageKey(address)
      const result = await window.storage.set(
        key,
        JSON.stringify(data),
        false
      )

      if (result) {
        setPlanDataState(data)
        setError(null)
        console.log('✅ Plan saved to storage')
        return true
      } else {
        throw new Error('Storage operation returned null')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Failed to save plan:', errorMsg)
      setError(errorMsg)
      return false
    }
  }, [address, getStorageKey])

  const clearPlanData = useCallback(async () => {
    if (!address) {
      console.warn('⚠️ Cannot clear plan: wallet not connected')
      return false
    }

    if (!window.storage) {
      console.warn('⚠️ Cannot clear plan: storage not available')
      return false
    }

    try {
      const key = getStorageKey(address)
      const result = await window.storage.delete(key, false)

      if (result?.deleted) {
        setPlanDataState(null)
        setError(null)
        console.log('✅ Plan cleared from storage')
        return true
      } else {
        throw new Error('Storage delete returned null')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Failed to clear plan:', errorMsg)
      setError(errorMsg)
      return false
    }
  }, [address, getStorageKey])

  const hasPlan = planData !== null
  const isPlanComplete = useCallback((plan: RetirementPlanData | null): boolean => {
    if (!plan) return false

    return !!(
      plan.initialDeposit &&
      plan.monthlyDeposit &&
      plan.currentAge > 0 &&
      plan.retirementAge > 0 &&
      plan.desiredMonthlyIncome > 0 &&
      plan.yearsPayments > 0 &&
      plan.interestRate > 0 &&
      plan.timelockYears > 0
    )
  }, [])

  return {
    // Estado
    planData,
    isLoading,
    error,
    hasPlan,
    isComplete: isPlanComplete(planData),

    // Acciones
    setPlanData,
    clearPlanData,

    // Helpers
    isStorageAvailable: !!window.storage,
  }
}
export function usePlan(): RetirementPlanData | null {
  const { planData } = usePersistedPlan()
  return planData
}
export function useHasPlan(): boolean {
  const { hasPlan } = usePersistedPlan()
  return hasPlan
}