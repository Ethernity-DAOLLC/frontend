import { Address } from 'viem'
import { useAccount } from 'wagmi'

export interface ContractAddresses {
  token: Address
  factory: Address
  treasury: Address
  governance: Address
  usdc: Address
  protocolRegistry: Address
  userPreferences: Address
  dateTime: Address
}

const ARBITRUM_SEPOLIA_ADDRESSES: ContractAddresses = {
  token: (import.meta.env.VITE_TOKEN_ADDRESS || '0xd9a61CE672841EBaCbdCB4e56F7bF0E17B48E29D') as Address,
  factory: (import.meta.env.VITE_FACTORY_ADDRESS || '0x45DdC7b0B7b9D6A0e6039f2f5Ad32c89D1C33808') as Address,
  treasury: (import.meta.env.VITE_TREASURY_ADDRESS || '0x872000afEC5dAa2fe6Df07F7e72F42C39F9Bd60e') as Address,
  governance: (import.meta.env.VITE_GOVERNANCE_ADDRESS || '0xC843f5743643fb9322d75030aFFD58C7C9b899D6') as Address,
  usdc: (import.meta.env.VITE_USDC_ADDRESS || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d') as Address,
  protocolRegistry: (import.meta.env.VITE_PROTOCOL_REGISTRY_ADDRESS || '0x06241a4A5B81f99f63beFC08AEF85e6586B27781') as Address,
  userPreferences: (import.meta.env.VITE_USER_PREFERENCES_ADDRESS || '0xACaF297e8187E538A8cB6B7a3b3376828fA2423f') as Address,
  dateTime: (import.meta.env.VITE_DATETIME_ADDRESS || '0x885F4a9DCaac74CaEf0dc72249Dc3D7a1bf3479F') as Address,
}

export function useContractAddresses(): ContractAddresses {
  const { chainId } = useAccount()
  
  // Por ahora solo Arbitrum Sepolia
  // Luego puedes agregar más chains
  return ARBITRUM_SEPOLIA_ADDRESSES
}