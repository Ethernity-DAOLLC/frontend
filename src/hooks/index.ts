'use client';
export { useEthernityDAO, useContractAddresses } from './useEthernityDAO';
export { useWallet } from '@/hooks/web3/useWallet.client';
export type { WalletState } from '@/hooks/web3/useWallet.client';


export {
  useNetwork,
  useIsCorrectNetwork,
  useCurrentChainId,
  useChainInfo,
  addNetworkToWallet,
  SUPPORTED_CHAINS,
} from './web3/useNetwork';

export { useUSDC } from './usdc/useUSDC';
export { useUSDCApprovalAndTransaction } from './usdc/useUSDCApprovalAndTransaction';
export { useContractWriteWithUSDC } from './usdc/useContractWriteWithUSDC';
export {
  formatUSDC,
  parseUSDC,
  needsApproval,
  formatUSDCWithSymbol,
  isValidUSDCAmount,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from './usdc/usdcUtils';

export { useToken } from './core/useToken';
export { useTreasury } from './core/useTreasury';
export { useGovernance } from './core/useGovernance';

export { 
  usePersonalFund,
  personalFundQueries,
} from './funds/usePersonalFund';

export type {
  FundInfo,
  TimelockInfo,
  EarlyRetirementStatus,
  AccountingInfo,
  RetirementProjection,
  PersonalFundData,
} from './funds/usePersonalFund';

export {
  usePersonalFundWithApproval,
  useUSDCAllowanceForFund,
} from './funds/usePersonalFundWithApproval';

export { usePersonalFundFactory } from './funds/usePersonalFundFactory';
export { useProtocolRegistry } from './defi/useProtocolRegistry';
export { useUserPreferences } from './defi/useUserPreferences';
export type { Address } from 'viem';
export type { UseEthernityDAOOptions } from './useEthernityDAO';
