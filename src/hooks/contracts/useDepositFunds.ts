import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseAbi } from 'viem'

const contractABI = parseAbi([
  'function deposit(uint256 amount) payable'
])

export function useDepositFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deposit = (contractAddress: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'deposit',
      args: [amount]
    })
  }

  return {
    deposit,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error
  }
}