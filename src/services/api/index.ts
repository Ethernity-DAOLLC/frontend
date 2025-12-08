import { buildApiUrl } from '@/lib/api'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface GlobalStats {
  totalUsers: number
  totalContracts: number
  totalDeposited: string
  activeChains: number[]
  timestamp: number
}

export interface SavedContract {
  id: string
  userAddress: string
  contractAddress: string
  chainId: number
  txHash: string
  planData: {
    initialDeposit: string
    monthlyDeposit: string
    currentAge: number
    retirementAge: number
    desiredMonthlyIncome: number
    yearsPayments: number
    interestRate: number
    timelockYears: number
  }
  createdAt: string
  updatedAt: string
}

export interface SavedDeposit {
  id: string
  contractAddress: string
  amount: string
  txHash: string
  chainId: number
  timestamp: number
  createdAt: string
}

export interface UserData {
  address: string
  email?: string
  contracts: SavedContract[]
  totalDeposited: string
  lastActivity: string
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const url = buildApiUrl(endpoint)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw {
          message: data.error?.message || data.message || `HTTP ${response.status}`,
          status: response.status,
          code: data.error?.code,
          details: data.error?.details,
        } as ApiError
      }

      return data
    } catch (error: any) {
      console.error(`❌ API Error [${endpoint}]:`, error)
      throw error
    }
  }

  async getStats(): Promise<GlobalStats> {
    return this.request<GlobalStats>('/api/stats')
  }

  async getChainStats(chainId: number) {
    return this.request(`/api/stats/chain/${chainId}`)
  }

  async saveEmail(address: string, email: string): Promise<ApiResponse> {
    return this.request('/api/users/email', {
      method: 'POST',
      body: JSON.stringify({ address, email }),
    })
  }

  async getUser(address: string): Promise<UserData> {
    return this.request<UserData>(`/api/users/${address}`)
  }

  async updateUserPreferences(address: string, preferences: any): Promise<ApiResponse> {
    return this.request('/api/users/preferences', {
      method: 'PUT',
      body: JSON.stringify({ address, preferences }),
    })
  }

  async saveContract(data: {
    userAddress: string
    contractAddress: string
    chainId: number
    txHash: string
    planData: {
      initialDeposit: string
      monthlyDeposit: string
      currentAge: number
      retirementAge: number
      desiredMonthlyIncome: number
      yearsPayments: number
      interestRate: number
      timelockYears: number
    }
  }): Promise<SavedContract> {
    return this.request<SavedContract>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getUserContracts(
    address: string, 
    chainId?: number
  ): Promise<SavedContract[]> {
    const query = chainId ? `?chainId=${chainId}` : ''
    return this.request<SavedContract[]>(`/api/contracts/${address}${query}`)
  }

  async getContract(contractAddress: string): Promise<SavedContract> {
    return this.request<SavedContract>(`/api/contracts/detail/${contractAddress}`)
  }

  async updateContract(
    contractAddress: string, 
    updates: Partial<SavedContract>
  ): Promise<ApiResponse> {
    return this.request('/api/contracts/update', {
      method: 'PUT',
      body: JSON.stringify({ contractAddress, updates }),
    })
  }

  async saveDeposit(data: {
    contractAddress: string
    amount: string
    txHash: string
    chainId: number
    timestamp?: number
  }): Promise<SavedDeposit> {
    return this.request<SavedDeposit>('/api/deposits', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timestamp: data.timestamp || Date.now(),
      }),
    })
  }

  async getDeposits(contractAddress: string): Promise<SavedDeposit[]> {
    return this.request<SavedDeposit[]>(`/api/deposits/${contractAddress}`)
  }

  async getUserDeposits(userAddress: string, chainId?: number): Promise<SavedDeposit[]> {
    const query = chainId ? `?chainId=${chainId}` : ''
    return this.request<SavedDeposit[]>(`/api/deposits/user/${userAddress}${query}`)
  }

  async checkTransaction(txHash: string, chainId: number) {
    return this.request(`/api/transactions/status`, {
      method: 'POST',
      body: JSON.stringify({ txHash, chainId }),
    })
  }

  async getTransactionHistory(
    userAddress: string, 
    chainId?: number,
    limit: number = 50
  ) {
    const query = new URLSearchParams()
    if (chainId) query.set('chainId', chainId.toString())
    query.set('limit', limit.toString())
    
    return this.request(`/api/transactions/${userAddress}?${query}`)
  }

  async syncContractEvents(contractAddress: string, chainId: number) {
    return this.request('/api/events/sync', {
      method: 'POST',
      body: JSON.stringify({ contractAddress, chainId }),
    })
  }

  async sendEmailNotification(data: {
    to: string
    subject: string
    template: string
    variables: Record<string, any>
  }) {
    return this.request('/api/notifications/email', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async trackEvent(data: {
    event: string
    userAddress?: string
    chainId?: number
    metadata?: Record<string, any>
  }) {
    return this.request('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
  async getUserAnalytics(userAddress: string, timeframe: '7d' | '30d' | '90d' = '30d') {
    return this.request(`/api/analytics/user/${userAddress}?timeframe=${timeframe}`)
  }
}
export const api = new ApiClient()

export const apiQueries = {
  stats: () => ['stats'],
  chainStats: (chainId: number) => ['stats', 'chain', chainId],
  user: (address: string) => ['user', address],
  userContracts: (address: string, chainId?: number) => 
    ['contracts', 'user', address, chainId],
  contract: (contractAddress: string) => ['contract', contractAddress],
  deposits: (contractAddress: string) => ['deposits', contractAddress],
  userDeposits: (userAddress: string, chainId?: number) => 
    ['deposits', 'user', userAddress, chainId],
}
export type {
  ApiError,
  ApiResponse,
  GlobalStats,
  SavedContract,
  SavedDeposit,
  UserData,
}