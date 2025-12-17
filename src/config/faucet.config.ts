export const FAUCET_CONFIG = {

  amountPerRequest: 100,
  cooldownHours: 24,
  availableChains: [421614] as const,

  messages: {
    success: '¡Tokens enviados exitosamente! Podrás solicitar más en 24 horas.',
    cooldown: 'Debes esperar {time} para solicitar más tokens.',
    empty: 'El faucet está temporalmente vacío. Intenta más tarde.',
    wrongNetwork: 'Cambia a {network} para usar el faucet.',
    notConnected: 'Conecta tu wallet para solicitar tokens.',
  }
} as const

export const TEST_TOKEN_ABI = [
  {
    inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export const FAUCET_ABI = [
  {
    inputs: [],
    name: "request_tokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "can_request",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "get_time_until_next_request",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get_faucet_balance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "amount_per_request",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cooldown_time",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get_stats",
    outputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
      { name: "", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export const isFaucetAvailable = (chainId?: number): boolean => {
  if (!chainId) return false
  return FAUCET_CONFIG.availableChains.includes(chainId as any)
}