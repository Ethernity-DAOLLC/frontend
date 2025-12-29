import { useAccount, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN } from '@/config/chains';

export function useCorrectChain() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const isCorrectChain = chain?.id === DEFAULT_CHAIN.id;
  const switchToCorrectChain = () => {
    if (!isCorrectChain) {
      switchChain({ chainId: DEFAULT_CHAIN.id });
    }
  };

  return {
    isCorrectChain,
    currentChain: chain,
    switchToCorrectChain,
    expectedChain: DEFAULT_CHAIN,
  };
}