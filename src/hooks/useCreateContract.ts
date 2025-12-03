import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseAbi } from 'viem'

const factoryABI = parseAbi([
  'function createRetirementContract(uint256 monthlyAmount, uint256 retirementAge) returns (address)'
])

export function useCreateContract() {
  const { 
    writeContract, 
    data: hash,
    isPending,
    error 
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash
  })

  const createContract = (
    factoryAddress: Address,
    monthlyAmount: bigint,
    retirementAge: number
  ) => {
    writeContract({
      address: factoryAddress,
      abi: factoryABI,
      functionName: 'createRetirementContract',
      args: [monthlyAmount, BigInt(retirementAge)]
    })
  }

  return {
    createContract,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error
  }
}