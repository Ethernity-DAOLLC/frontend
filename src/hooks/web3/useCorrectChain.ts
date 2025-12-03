import { useAccount, useSwitchChain } from 'wagmi'
import { arbitrumSepolia } from '@reown/appkit/networks'

export function useCorrectChain() {
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const isCorrectChain = chain?.id === arbitrumSepolia.id
  
  const switchToCorrectChain = () => {
    if (!isCorrectChain) {
      switchChain({ chainId: arbitrumSepolia.id })
    }
  }

  return {
    isCorrectChain,
    currentChain: chain,
    switchToCorrectChain
  }
}