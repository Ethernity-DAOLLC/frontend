import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { useDisconnect, useAccount } from 'wagmi'

export function useWallet() {
  const { open } = useAppKit()
  const { address, isConnected, caipAddress } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { chain } = useAccount()
  const { disconnect } = useDisconnect()

  return {
    address,
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