import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useBalance, usePublicClient } from 'wagmi';
import { parseUnits, type Address, type Abi, formatEther } from 'viem';

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as Address;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

interface UseContractWriteWithUSDCProps {
  contractAddress: Address;
  abi: Abi;
  functionName: string;
  args: any[];
  usdcAmount: string | number;
  enabled?: boolean;
  onTransactionSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

interface UseContractWriteWithUSDCResult {
  executeAll: () => Promise<void>;
  isLoading: boolean;
  isApproving: boolean;
  isSuccess: boolean;
  error: Error | null;
  txHash: string | undefined;
  resetState: () => void;
  validationError: string | null;
}

export const useContractWriteWithUSDC = ({
  contractAddress,
  abi,
  functionName,
  args,
  usdcAmount,
  enabled = true,
  onTransactionSuccess,
  onError,
}: UseContractWriteWithUSDCProps): UseContractWriteWithUSDCResult => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState<'idle' | 'checking' | 'resetting' | 'approving' | 'executing'>('idle');
  const { data: ethBalance } = useBalance({
    address: address,
  });

  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && enabled,
    },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress && enabled,
    },
  });

  const {
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract() as any;

  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const {
    writeContract: writeTransaction,
    data: transactionHash,
    isPending: isTransactionPending,
    error: transactionError,
    reset: resetTransaction,
  } = useWriteContract() as any;

  const {
    isLoading: isTransactionConfirming,
    isSuccess: isTransactionSuccess,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const parseUSDCAmount = useCallback((amount: string | number): bigint => {
    try {
      const amountStr = typeof amount === 'string' ? amount : amount.toString();
      const cleanAmount = amountStr.replace(/,/g, '').trim();
      return parseUnits(cleanAmount, 6);
    } catch (err) {
      console.error('Error parsing USDC amount:', err);
      throw new Error(`Invalid USDC amount: ${amount}`);
    }
  }, []);
  const validateTransaction = useCallback(async (): Promise<boolean> => {
    setValidationError(null);
    if (!address || !contractAddress) {
      setValidationError('Missing wallet or contract address');
      return false;
    }
    if (!ethBalance || ethBalance.value === 0n) {
      setValidationError('❌ Insufficient ETH for gas fees. Request ETH from the faucet first.');
      return false;
    }
    const minEthRequired = parseUnits('0.0001', 18);
    if (ethBalance.value < minEthRequired) {
      setValidationError(`❌ Insufficient ETH for gas. You have ${formatEther(ethBalance.value)} ETH. Request more from the faucet.`);
      return false;
    }
    const requiredAmount = parseUSDCAmount(usdcAmount);
    console.log('💰 Validation:', {
      usdcBalance: usdcBalance?.toString(),
      requiredAmount: requiredAmount.toString(),
      ethBalance: ethBalance.value.toString(),
    });
    if (!usdcBalance || usdcBalance === 0n) {
      setValidationError('❌ No USDC balance. Request USDC from the faucet first.');
      return false;
    }
    if (usdcBalance < requiredAmount) {
      const balanceFormatted = (Number(usdcBalance) / 1_000_000).toFixed(2);
      const requiredFormatted = (Number(requiredAmount) / 1_000_000).toFixed(2);
      setValidationError(
        `❌ Insufficient USDC. You have ${balanceFormatted} USDC but need ${requiredFormatted} USDC. Request more from the faucet.`
      );
      return false;
    }
    try {
      if (publicClient) {
        await publicClient.estimateGas({
          account: address,
          to: USDC_ADDRESS,
          data: publicClient.encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contractAddress, requiredAmount],
          }),
        });
      }
    } catch (err: any) {
      console.error('Gas estimation failed:', err);
      setValidationError(`❌ Transaction will likely fail: ${err.shortMessage || err.message}`);
      return false;
    }
    return true;
  }, [address, contractAddress, ethBalance, usdcBalance, usdcAmount, parseUSDCAmount, publicClient]);
  const executeAll = useCallback(async () => {
    if (!enabled || !address || !contractAddress) {
      setError(new Error('Missing required parameters'));
      return;
    }
    setError(null);
    setValidationError(null);
    setIsApproving(true);
    setCurrentStep('checking');

    try {
      console.log('🔍 Running pre-flight checks...');
      const isValid = await validateTransaction();
      
      if (!isValid) {
        setIsApproving(false);
        setCurrentStep('idle');
        return;
      }
      const requiredAmount = parseUSDCAmount(usdcAmount);
      console.log('📊 Required approval amount:', requiredAmount.toString());
      await refetchAllowance();
      await refetchUsdcBalance();
      const currentAllowanceValue = (currentAllowance as bigint) || 0n;
      console.log('📊 Current allowance:', currentAllowanceValue.toString());
      if (currentAllowanceValue > 0n) {
        console.log('🔄 Resetting existing allowance to 0...');
        setCurrentStep('resetting');
        writeApproval({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress, 0n],
        });
        return;
      }
      console.log('🔐 Approving USDC...', {
        amount: requiredAmount.toString(),
        spender: contractAddress,
        from: address,
      });
      setCurrentStep('approving');
      writeApproval({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress, requiredAmount],
      } as any);
    } catch (err: any) {
      console.error('❌ Error in executeAll:', err);
      const errorMessage = err?.shortMessage || err?.message || 'Unknown error during approval';
      setError(new Error(errorMessage));
      setIsApproving(false);
      setCurrentStep('idle');
      onError?.(new Error(errorMessage));
    }
  }, [
    enabled,
    address,
    contractAddress,
    usdcAmount,
    parseUSDCAmount,
    refetchAllowance,
    refetchUsdcBalance,
    currentAllowance,
    writeApproval,
    validateTransaction,
    onError,
  ]);

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && currentStep === 'approving') {
      console.log('✅ USDC approval confirmed:', approvalHash);
      setCurrentStep('executing');
      setTimeout(() => {
        console.log('🚀 Executing main contract function...');
        writeTransaction({
          address: contractAddress,
          abi,
          functionName,
          args,
        } as any);
      }, 1000);
    }
  }, [isApprovalSuccess, approvalHash, currentStep, writeTransaction, contractAddress, abi, functionName, args]);

  useEffect(() => {
    if (isApprovalSuccess && approvalHash && currentStep === 'resetting') {
      console.log('✅ Allowance reset confirmed, now approving new amount...');
      
      setTimeout(async () => {
        const requiredAmount = parseUSDCAmount(usdcAmount);
        setCurrentStep('approving');
        
        writeApproval({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress, requiredAmount],
        } as any);
      }, 1000);
    }
  }, [isApprovalSuccess, approvalHash, currentStep, parseUSDCAmount, usdcAmount, contractAddress, writeApproval]);
  useEffect(() => {
    if (isTransactionSuccess && transactionHash) {
      console.log('✅ Transaction successful:', transactionHash);
      setTxHash(transactionHash);
      setIsApproving(false);
      setCurrentStep('idle');
      onTransactionSuccess?.(transactionHash);
    }
  }, [isTransactionSuccess, transactionHash, onTransactionSuccess]);
  useEffect(() => {
    if (approvalError) {
      console.error('❌ Approval error:', approvalError);
      const errorMessage = (approvalError as any)?.shortMessage || approvalError.message;
      setError(new Error(`Approval failed: ${errorMessage}`));
      setIsApproving(false);
      setCurrentStep('idle');
      onError?.(new Error(errorMessage));
    }
  }, [approvalError, onError]);
  useEffect(() => {
    if (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      const errorMessage = (transactionError as any)?.shortMessage || transactionError.message;
      setError(new Error(`Transaction failed: ${errorMessage}`));
      setIsApproving(false);
      setCurrentStep('idle');
      onError?.(new Error(errorMessage));
    }
  }, [transactionError, onError]);

  const resetState = useCallback(() => {
    setError(null);
    setValidationError(null);
    setTxHash(undefined);
    setIsApproving(false);
    setCurrentStep('idle');
    resetApproval();
    resetTransaction();
  }, [resetApproval, resetTransaction]);

  const isLoading =
    isApprovalPending ||
    isApprovalConfirming ||
    isTransactionPending ||
    isTransactionConfirming ||
    currentStep !== 'idle';

  return {
    executeAll,
    isLoading,
    isApproving: isApproving || currentStep === 'approving' || currentStep === 'resetting',
    isSuccess: isTransactionSuccess,
    error,
    txHash,
    resetState,
    validationError,
  };
};