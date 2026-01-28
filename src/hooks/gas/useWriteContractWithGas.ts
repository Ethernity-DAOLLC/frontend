import { useWriteContract } from 'wagmi';
import { useCallback } from 'react';
import { useAutoGas } from './useGasEstimation';
import type { Address, Abi } from 'viem';

interface WriteContractWithGasParams {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: any[];
  value?: bigint;
}

export function useWriteContractWithGas() {
  const { writeContract: originalWriteContract, ...rest } = useWriteContract();
  const { gasConfig, isReady } = useAutoGas();
  const writeContract = useCallback(
    (params: WriteContractWithGasParams) => {
      const enhancedParams = {
        ...params,
        ...(isReady && gasConfig),
      };

      return originalWriteContract(enhancedParams as any);
    },
    [originalWriteContract, gasConfig, isReady]
  );

  return {
    writeContract,
    gasConfig, 
    isGasReady: isReady,
    ...rest,
  };
}