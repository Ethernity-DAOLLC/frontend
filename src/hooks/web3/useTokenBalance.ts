import { useReadContract } from 'wagmi'
import { Address, parseAbi } from 'viem'

const tokenABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
])

export function useTokenBalance(tokenAddress: Address, account?: Address) {
  const { data: balance, isLoading, error } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: {
      enabled: !!account
    }
  })

  return {
    balance,
    isLoading,
    error
  }
}