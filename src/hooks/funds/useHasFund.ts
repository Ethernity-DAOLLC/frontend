import { useAccount, useReadContract } from 'wagmi';
import { useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/addresses';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';

export function useHasFund() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const factoryAddress = CONTRACT_ADDRESSES[chainId]?.personalFundFactory;
  const { data: userFund, isLoading, refetch } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: PersonalFundFactoryABI,
    functionName: 'userFunds',
    args: [address],
    query: {
      enabled: !!address && !!factoryAddress && isConnected,
    },
  });

  const hasFund = 
    userFund !== undefined && 
    userFund !== '0x0000000000000000000000000000000000000000' &&
    userFund !== null;

  return {
    hasFund,
    fundAddress: userFund as `0x${string}` | undefined,
    isLoading,
    refetch,
    isConnected,
  };
}