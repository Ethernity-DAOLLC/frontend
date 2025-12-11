// ============================================
// ESTRUCTURA DE HOOKS PARA EL SISTEMA DAO
// ============================================

// 1. TOKEN HOOKS (Token.vy - Geras)
// ============================================

export const useTokenContract = () => {
  // LECTURA (View functions)
  const getTokenBalance = async (address: string) => {
    // balanceOf(address)
  }
  
  const canUserVote = async (address: string) => {
    // canVote(address) -> bool
  }
  
  const getNextBurnDate = async () => {
    // getNextBurnDate() -> (year, month, day)
  }
  
  const getNextRenewDate = async () => {
    // getNextRenewDate() -> (year, month, day)
  }
  
  const canBurnToday = async () => {
    // canBurnToday() -> bool
  }
  
  const canRenewToday = async () => {
    // canRenewToday() -> bool
  }
  
  const getCurrentDate = async () => {
    // getCurrentDate() -> (year, month, day)
  }

  // ESCRITURA (Transacciones)
  const recordActivity = async (user: string, activityType: string) => {
    // recordActivity(user, activityType)
    // Solo autorizado contracts/treasury/admin
  }
  
  const burnMonthlyTokens = async () => {
    // burnMonthlyTokens() - día 28
    // Requiere: día 28, no burned este mes
  }
  
  const renewMonthlyTokens = async () => {
    // renewMonthlyTokens() - día 1
    // Requiere: día 1, no renewed este mes
  }

  // EVENTOS A ESCUCHAR
  const subscribeToEvents = () => {
    // Transfer(sender, receiver, value)
    // TokensBurned(account, amount, timestamp)
    // TokensRenewed(account, amount, timestamp)
    // SupplyReplenished(oldMaxSupply, newMaxSupply, timestamp)
  }
  
  return {
    // Views
    getTokenBalance,
    canUserVote,
    getNextBurnDate,
    getNextRenewDate,
    canBurnToday,
    canRenewToday,
    getCurrentDate,
    // Transactions
    recordActivity,
    burnMonthlyTokens,
    renewMonthlyTokens,
    // Events
    subscribeToEvents
  }
}

// 2. TREASURY HOOKS (Treasury.vy)
// ============================================

export const useTreasuryContract = () => {
  // LECTURA
  const getTreasuryBalance = async () => {
    // getTreasuryBalance() -> uint256 (USDC balance)
  }
  
  const getTotalFeesCollected = async () => {
    // getTotalFeesCollected() -> uint256 (histórico)
  }
  
  const getFundFeeRecord = async (fundAddress: string) => {
    // getFundFeeRecord(address) -> FundFeeRecord
    // Returns: totalFeesPaid, lastFeeTimestamp, feeCount
  }
  
  const getEarlyRetirementRequest = async (fundAddress: string) => {
    // getEarlyRetirementRequest(address) -> EarlyRetirementRequest
  }
  
  const getPendingRequests = async () => {
    // getPendingRequests() -> address[]
  }
  
  const calculateFee = async (amount: bigint) => {
    // calculateFee(amount) -> uint256 (3% del amount)
  }

  // ESCRITURA
  const requestEarlyRetirement = async (fundAddress: string, reason: string) => {
    // requestEarlyRetirement(fundAddress, reason)
    // Solo fund owner
  }
  
  const withdrawFees = async (recipient: string, amount: bigint) => {
    // withdrawFees(recipient, amount)
    // Solo admin
  }

  // EVENTOS
  const subscribeToEvents = () => {
    // FeeReceived(fundAddress, amount, totalFromFund, timestamp)
    // EarlyRetirementRequested(fundAddress, requester, proposalId, timestamp)
    // EarlyRetirementApproved(fundAddress, proposalId, approver, timestamp)
    // FeesWithdrawn(recipient, amount, token, timestamp)
  }
  
  return {
    getTreasuryBalance,
    getTotalFeesCollected,
    getFundFeeRecord,
    getEarlyRetirementRequest,
    getPendingRequests,
    calculateFee,
    requestEarlyRetirement,
    withdrawFees,
    subscribeToEvents
  }
}

// 3. GOVERNANCE HOOKS (Governance.vy)
// ============================================

export const useGovernanceContract = () => {
  // LECTURA
  const getProposal = async (proposalId: number) => {
    // getProposal(id) -> Proposal struct
  }
  
  const getProposalState = async (proposalId: number) => {
    // getProposalState(id) -> "Pending" | "Active" | "Succeeded" | "Defeated" | "Executed" | "Cancelled"
  }
  
  const getVoteResult = async (proposalId: number) => {
    // getVoteResult(id) -> (votesFor, votesAgainst, isApproved)
  }
  
  const hasVoted = async (proposalId: number, voter: string) => {
    // hasVoted(proposalId, voter) -> bool
  }
  
  const getVote = async (proposalId: number, voter: string) => {
    // getVote(proposalId, voter) -> Vote struct
  }
  
  const getAllProposals = async () => {
    // getAllProposals() -> uint256[]
  }
  
  const getActiveProposals = async () => {
    // getActiveProposals() -> uint256[]
  }
  
  const hasReachedQuorum = async (proposalId: number) => {
    // hasReachedQuorum(proposalId) -> bool
  }
  
  const getVoterStats = async (voter: string) => {
    // getVoterStats(voter) -> (totalVotes, lastVoteTimestamp)
  }

  // ESCRITURA
  const createProposal = async (params: {
    title: string,
    description: string,
    proposalType: number, // 0=General, 1=EarlyRetirement, 2=Treasury, 3=Parameter
    targetAddress: string,
    targetValue: bigint
  }) => {
    // createProposal(...) -> proposalId
    // Requiere: tener governance token activo
  }
  
  const castVote = async (proposalId: number, support: boolean) => {
    // castVote(proposalId, support)
    // Requiere: tener token activo, no haber votado, proposal activa
  }
  
  const executeProposal = async (proposalId: number) => {
    // executeProposal(proposalId)
    // Solo treasury/admin, después de voting period, si aprobada y quorum alcanzado
  }
  
  const cancelProposal = async (proposalId: number) => {
    // cancelProposal(proposalId)
    // Solo proposer o admin
  }

  // EVENTOS
  const subscribeToEvents = () => {
    // ProposalCreated(proposalId, proposer, title, proposalType, startTime, endTime)
    // VoteCast(proposalId, voter, support, timestamp)
    // ProposalExecuted(proposalId, executor, timestamp)
    // ProposalCancelled(proposalId, canceller)
  }
  
  return {
    getProposal,
    getProposalState,
    getVoteResult,
    hasVoted,
    getVote,
    getAllProposals,
    getActiveProposals,
    hasReachedQuorum,
    getVoterStats,
    createProposal,
    castVote,
    executeProposal,
    cancelProposal,
    subscribeToEvents
  }
}

// 4. PERSONAL FUND HOOKS (PersonalFund.vy)
// ============================================

export const usePersonalFundContract = (fundAddress: string) => {
  // LECTURA
  const getFundInfo = async () => {
    // getFundInfo() -> (owner, principal, monthlyDeposit, retirementAge, 
    //                   totalGrossDeposited, totalFeesPaid, totalNetToOwner, retirementStarted)
  }
  
  const getDepositStats = async () => {
    // getDepositStats() -> (totalGross, totalFees, totalNet, depositCount)
  }
  
  const getTimelockInfo = async () => {
    // getTimelockInfo() -> (timelockEnd, remaining, isUnlocked)
  }
  
  const canStartRetirement = async () => {
    // canStartRetirement() -> bool
  }
  
  const isEarlyRetirementApproved = async () => {
    // isEarlyRetirementApproved() -> bool
  }
  
  const calculateFeeForAmount = async (amount: bigint) => {
    // calculateFeeForAmount(amount) -> (fee, net)
  }

  // ESCRITURA
  const depositMonthly = async () => {
    // depositMonthly()
    // Requiere: approval de USDC, ser owner, no retirado
    // AUTOMÁTICAMENTE:
    // - Toma monthlyDeposit del usuario
    // - Envía 3% a Treasury
    // - Devuelve 97% al owner
  }
  
  const startRetirement = async () => {
    // startRetirement()
    // Requiere: timelock cumplido, ser owner
  }

  // EVENTOS
  const subscribeToEvents = () => {
    // Initialized(owner, treasury, usdc, initialDeposit, feeAmount, netToOwner, timestamp)
    // MonthlyDeposited(owner, grossAmount, feeAmount, netToOwner, depositNumber, timestamp)
    // EarlyRetirementApproved(approver, timestamp)
    // RetirementStarted(owner, timestamp)
  }
  
  return {
    getFundInfo,
    getDepositStats,
    getTimelockInfo,
    canStartRetirement,
    isEarlyRetirementApproved,
    calculateFeeForAmount,
    depositMonthly,
    startRetirement,
    subscribeToEvents
  }
}

// 5. PERSONAL FUND FACTORY HOOKS (PersonalFundFactory.vy)
// ============================================

export const usePersonalFundFactoryContract = () => {
  // LECTURA
  const getUserFund = async (userAddress: string) => {
    // getUserFund(address) -> fundAddress
  }
  
  const canUserCreateFund = async (userAddress: string) => {
    // canUserCreateFund(address) -> bool (solo 1 fund por usuario)
  }
  
  const getFundOwner = async (fundAddress: string) => {
    // getFundOwner(fundAddress) -> ownerAddress
  }
  
  const getAllFunds = async () => {
    // getAllFunds() -> address[]
  }
  
  const getFundCount = async () => {
    // getFundCount() -> uint256
  }
  
  const predictFundAddress = async (userAddress: string) => {
    // predictFundAddress(user) -> futureAddress
  }
  
  const calculateInitialDeposit = async (principal: bigint, monthly: bigint) => {
    // calculateInitialDeposit(principal, monthly) -> total
  }
  
  const getConfiguration = async () => {
    // getConfiguration() -> (minPrincipal, maxPrincipal, minMonthly, 
    //                        minAge, maxAge, minRetirementAge, minTimelock, maxTimelock)
  }

  // ESCRITURA
  const createPersonalFund = async (params: {
    principal: bigint,
    monthlyDeposit: bigint,
    currentAge: number,
    retirementAge: number,
    desiredMonthly: bigint,
    yearsPayments: number,
    interestRate: number,
    timelockYears: number
  }) => {
    // createPersonalFund(...) -> fundAddress
    // Requiere: USDC approval para (principal + monthlyDeposit)
    // AUTOMÁTICAMENTE:
    // - Crea PersonalFund
    // - Transfiere USDC inicial
    // - El PersonalFund procesa fee (3% a Treasury, 97% al owner)
    // - Mintea Geras token al usuario
  }

  // EVENTOS
  const subscribeToEvents = () => {
    // FundCreated(fundAddress, owner, initialDeposit, principal, monthlyDeposit, 
    //             retirementAge, timelockEnd, timestamp)
  }
  
  return {
    getUserFund,
    canUserCreateFund,
    getFundOwner,
    getAllFunds,
    getFundCount,
    predictFundAddress,
    calculateInitialDeposit,
    getConfiguration,
    createPersonalFund,
    subscribeToEvents
  }
}

// 6. PROTOCOL REGISTRY HOOKS (ProtocolRegistry.vy)
// ============================================

export const useProtocolRegistryContract = () => {
  // LECTURA
  const getProtocol = async (protocolAddress: string) => {
    // getProtocol(address) -> DeFiProtocol struct
  }
  
  const getActiveProtocols = async () => {
    // getActiveProtocols() -> address[]
  }
  
  const getProtocolsByRisk = async (riskLevel: number) => {
    // getProtocolsByRisk(1|2|3) -> address[]
    // 1=Low, 2=Medium, 3=High
  }
  
  const getTotalValueLocked = async () => {
    // getTotalValueLocked() -> uint256
  }
  
  const getProtocolStats = async (protocolAddress: string) => {
    // getProtocolStats(address) -> (apy, totalDeposited, isActive)
  }
  
  const isProtocolActive = async (protocolAddress: string) => {
    // isProtocolActive(address) -> bool
  }

  // ESCRITURA (Solo Admin/Treasury)
  const addDeFiProtocol = async (params: {
    protocolAddress: string,
    name: string,
    apy: number,
    riskLevel: number
  }) => {
    // addDeFiProtocol(...)
  }
  
  const updateProtocolAPY = async (protocolAddress: string, newAPY: number) => {
    // updateProtocolAPY(address, apy)
  }
  
  const toggleProtocolStatus = async (protocolAddress: string) => {
    // toggleProtocolStatus(address)
  }

  // EVENTOS
  const subscribeToEvents = () => {
    // ProtocolAdded(protocolAddress, name, apy, riskLevel)
    // ProtocolUpdated(protocolAddress, apy, isActive)
    // ProtocolRemoved(protocolAddress, timestamp)
  }
  
  return {
    getProtocol,
    getActiveProtocols,
    getProtocolsByRisk,
    getTotalValueLocked,
    getProtocolStats,
    isProtocolActive,
    addDeFiProtocol,
    updateProtocolAPY,
    toggleProtocolStatus,
    subscribeToEvents
  }
}

// 7. USER PREFERENCES HOOKS (UserPreferences.vy)
// ============================================

export const useUserPreferencesContract = () => {
  // LECTURA
  const getUserConfig = async (userAddress: string) => {
    // getUserConfig(address) -> UserConfig
    // Returns: selectedProtocol, autoCompound, riskTolerance, lastUpdate
  }
  
  const getRecommendedProtocol = async (userAddress: string) => {
    // getRecommendedProtocol(address) -> protocolAddress
  }
  
  const getProtocolDeposits = async (protocolAddress: string) => {
    // getProtocolDeposits(address) -> uint256
  }

  // ESCRITURA
  const setUserConfig = async (params: {
    selectedProtocol: string,
    autoCompound: boolean,
    riskTolerance: number
  }) => {
    // setUserConfig(protocol, autoCompound, riskTolerance)
  }

  // EVENTOS
  const subscribeToEvents = () => {
    // UserConfigUpdated(user, selectedProtocol, autoCompound, timestamp)
    // DepositRouted(user, protocol, amount, timestamp)
  }
  
  return {
    getUserConfig,
    getRecommendedProtocol,
    getProtocolDeposits,
    setUserConfig,
    subscribeToEvents
  }
}

// ============================================
// EJEMPLO DE USO INTEGRADO
// ============================================

export const useDashboard = (userAddress: string) => {
  const token = useTokenContract()
  const treasury = useTreasuryContract()
  const governance = useGovernanceContract()
  const factory = usePersonalFundFactoryContract()
  
  const getDashboardData = async () => {
    const [
      balance,
      canVote,
      userFund,
      treasuryBalance,
      activeProposals
    ] = await Promise.all([
      token.getTokenBalance(userAddress),
      token.canUserVote(userAddress),
      factory.getUserFund(userAddress),
      treasury.getTreasuryBalance(),
      governance.getActiveProposals()
    ])
    
    // Si el usuario tiene fund, obtener sus stats
    let fundStats = null
    if (userFund !== '0x0000000000000000000000000000000000000000') {
      const fundHook = usePersonalFundContract(userFund)
      fundStats = await fundHook.getFundInfo()
    }
    
    return {
      token: { balance, canVote },
      fund: fundStats,
      treasury: { balance: treasuryBalance },
      governance: { activeProposals }
    }
  }
  
  return { getDashboardData }
}