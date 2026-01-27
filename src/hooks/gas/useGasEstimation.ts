import { useEstimateGas, useGasPrice, usePublicClient } from 'wagmi';
import { useCallback, useMemo } from 'react';
import type { Address, Abi } from 'viem';

interface GasConfig {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: bigint;
}

interface UseGasEstimationParams {
  address?: Address;
  abi?: Abi;
  functionName?: string;
  args?: any[];
  enabled?: boolean;
}

export function useGasEstimation({
  address,
  abi,
  functionName,
  args,
  enabled = true,
}: UseGasEstimationParams = {}) {
  const publicClient = usePublicClient();
  const { data: gasPrice } = useGasPrice({
    query: {
      enabled,
      refetchInterval: 12000, 
    },
  });

  const calculateGasConfig = useCallback(
    async (customMultiplier?: number): Promise<GasConfig> => {
      if (!publicClient) {
        return {};
      }

      try {
        const block = await publicClient.getBlock({ blockTag: 'latest' });
        const baseFee = block.baseFeePerGas;
        const multiplier = customMultiplier || 1.2;

        if (baseFee) {
          const priorityFee = gasPrice ? gasPrice / 10n : 2_000_000_000n; 
          const maxFeePerGas = (baseFee * BigInt(Math.floor(multiplier * 100))) / 100n + priorityFee;
          return {
            maxFeePerGas,
            maxPriorityFeePerGas: priorityFee,
          };
        }

        if (gasPrice) {
          return {
            maxFeePerGas: (gasPrice * BigInt(Math.floor(multiplier * 100))) / 100n,
          };
        }

        return {};
      } catch (error) {
        console.warn('Error calculating gas config:', error);
        return {};
      }
    },
    [publicClient, gasPrice]
  );

  const estimateGasLimit = useCallback(
    async (customMultiplier?: number): Promise<bigint | undefined> => {
      if (!publicClient || !address || !abi || !functionName) {
        return undefined;
      }

      try {
        const gas = await publicClient.estimateContractGas({
          address,
          abi,
          functionName,
          args: args || [],
        } as any);

        const multiplier = customMultiplier || 1.2;
        return (gas * BigInt(Math.floor(multiplier * 100))) / 100n;
      } catch (error) {
        console.warn('Error estimating gas limit:', error);
        return undefined;
      }
    },
    [publicClient, address, abi, functionName, args]
  );

  const getFullGasConfig = useCallback(
    async (feeMultiplier?: number, limitMultiplier?: number): Promise<GasConfig> => {
      const [gasConfig, gasLimit] = await Promise.all([
        calculateGasConfig(feeMultiplier),
        estimateGasLimit(limitMultiplier),
      ]);

      return {
        ...gasConfig,
        ...(gasLimit && { gasLimit }),
      };
    },
    [calculateGasConfig, estimateGasLimit]
  );

  const autoGasConfig = useMemo<GasConfig>(() => {
    if (!gasPrice || !publicClient) return {};

    const priorityFee = gasPrice / 10n; 
    const maxFee = (gasPrice * 12n) / 10n; 
    return {
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: priorityFee,
    };
  }, [gasPrice, publicClient]);

  return {
    gasConfig: autoGasConfig,
    calculateGasConfig,
    estimateGasLimit,
    getFullGasConfig,
    gasPrice,
    publicClient,
    isReady: !!gasPrice && !!publicClient,
  };
}

export function useAutoGas() {
  const { gasConfig, isReady } = useGasEstimation();
  return { gasConfig, isReady };
}

export function formatGasPrice(wei: bigint | undefined): string {
  if (!wei) return '0';
  return (Number(wei) / 1e9).toFixed(2);
}

export function calculateTransactionCost(
  gasLimit: bigint | undefined,
  maxFeePerGas: bigint | undefined
): bigint {
  if (!gasLimit || !maxFeePerGas) return 0n;
  return gasLimit * maxFeePerGas;
}
