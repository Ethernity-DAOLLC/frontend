import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import FactoryABI from '@/abis/PersonalFundFactory.json';
import { parseEther } from 'viem';

export function usePersonalFundFactory(factoryAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'admin',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'treasury',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'token',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'personalFundImplementation',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'totalFundsCreated',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'minPrincipal',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'maxPrincipal',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'minAge',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'maxAge',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'minRetirementAge',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'minTimelockYears',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'maxTimelockYears',
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'getUserFund',
        args: [userAddress],
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'canUserCreateFund',
        args: [userAddress],
      },
      {
        address: factoryAddress,
        abi: FactoryABI,
        functionName: 'getUserFundCount',
        args: [userAddress],
      },
    ],
  });

  const [
    admin,
    treasury,
    token,
    personalFundImplementation,
    totalFundsCreated,
    minPrincipal,
    maxPrincipal,
    minAge,
    maxAge,
    minRetirementAge,
    minTimelockYears,
    maxTimelockYears,
    userFund,
    canUserCreateFund,
    userFundCount,
  ] = data || [];

  const useGetFundOwner = (fundAddress: `0x${string}`) => {
    return useReadContract({
      address: factoryAddress,
      abi: FactoryABI,
      functionName: 'getFundOwner',
      args: [fundAddress],
    });
  };

  const useGetAllFunds = () => {
    return useReadContract({
      address: factoryAddress,
      abi: FactoryABI,
      functionName: 'getAllFunds',
    });
  };

  const useGetFundCount = () => {
    return useReadContract({
      address: factoryAddress,
      abi: FactoryABI,
      functionName: 'getFundCount',
    });
  };

const createPersonalFund = (params: {
  principal: bigint;
  monthlyDeposit: bigint;
  currentAge: number;
  retirementAge: number;
  desiredMonthly: bigint;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}) => {
  console.log('Creating fund with params:', {
    principal: params.principal.toString(),
    monthlyDeposit: params.monthlyDeposit.toString(),
    currentAge: params.currentAge,
    retirementAge: params.retirementAge,
    desiredMonthly: params.desiredMonthly.toString(),
    yearsPayments: params.yearsPayments,
    interestRate: params.interestRate,
    timelockYears: params.timelockYears,
    value: params.principal.toString(),
  });

  writeContract({
    address: factoryAddress,
    abi: FactoryABI,
    functionName: 'createPersonalFund',
    args: [
      params.principal,
      params.monthlyDeposit,
      BigInt(params.currentAge),
      BigInt(params.retirementAge),  
      params.desiredMonthly,        
      BigInt(params.yearsPayments),  
      BigInt(params.interestRate),   
      BigInt(params.timelockYears),  
    ],
    value: params.principal, 
  });
};

  const configure = (treasuryAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
    writeContract({
      address: factoryAddress,
      abi: FactoryABI,
      functionName: 'configure',
      args: [treasuryAddress, tokenAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    admin: admin?.result as `0x${string}` | undefined,
    treasury: treasury?.result as `0x${string}` | undefined,
    token: token?.result as `0x${string}` | undefined,
    personalFundImplementation: personalFundImplementation?.result as `0x${string}` | undefined,
    totalFundsCreated: totalFundsCreated?.result as bigint | undefined,
    minPrincipal: minPrincipal?.result as bigint | undefined,
    maxPrincipal: maxPrincipal?.result as bigint | undefined,
    minAge: minAge?.result as bigint | undefined,
    maxAge: maxAge?.result as bigint | undefined,
    minRetirementAge: minRetirementAge?.result as bigint | undefined,
    minTimelockYears: minTimelockYears?.result as bigint | undefined,
    maxTimelockYears: maxTimelockYears?.result as bigint | undefined,
    userFund: userFund?.result as `0x${string}` | undefined,
    canUserCreateFund: canUserCreateFund?.result as boolean | undefined,
    userFundCount: userFundCount?.result as bigint | undefined,

    isLoading,
    isPending,
    isConfirming,
    isSuccess,

    useGetFundOwner,
    useGetAllFunds,
    useGetFundCount,

    createPersonalFund,
    configure,
    refetch,
  };
}
