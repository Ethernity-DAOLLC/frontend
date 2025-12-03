'use client'

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { useDisconnect, useAccount } from 'wagmi'
import type { Chain, Address } from 'viem'

export interface WalletState {
  address: Address | undefined
  isConnected: boolean
  chainId: number | undefined
  chain: Chain | undefined
  openModal: () => void
  openAccount: () => void
  openNetworks: () => void
  disconnect: () => void
  shortAddress: string | undefined
}

export function useWallet(): WalletState {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { chainId: rawChainId } = useAppKitNetwork()
  const { chain } = useAccount()
  const { disconnect } = useDisconnect()

  const safeAddress = address ? (address as Address) : undefined
  const chainId = rawChainId != null ? Number(rawChainId) : undefined

  return {
    address: safeAddress,
    isConnected,
    chainId,
    chain,
    openModal: () => open(),
    openAccount: () => open({ view: 'Account' }),
    openNetworks: () => open({ view: 'Networks' }),
    disconnect,
    shortAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : undefined,
  }
}