export {
  USDC_DECIMALS,
  USDC_MIN_AMOUNT,
  USDC_MAX_AMOUNT,
  USDC_PRESETS,

  getUSDCAddress,
  useUSDCAddress,
  formatUSDC,
  formatUSDCWithSymbol,
  formatUSDCDisplay,
  parseUSDC,
  usdcToNumber,
  isValidUSDCAmount,
  needsApproval,
  hasEnoughBalance,
  compareUSDC,
  minUSDC,
  maxUSDC,
  addUSDC,
  subtractUSDC,
  multiplyUSDC,
  percentageOfUSDC,

  isUSDCAddress,
} from './usdcUtils';

export type { USDCPreset } from './usdcUtils';
export {
  useUSDCBalance,
  useUSDCAllowance,
  useUSDCSymbol,
  useUSDCName,
  useUSDCDecimals,
  useUSDCTotalSupply,
  useUSDCInfo,
} from './useUSDC';

export { useUSDCApproval } from './useUSDCApproval';
export { useUSDCTransaction } from './useUSDCTransaction';
export { useUSDCBalance as useUSDC } from './useUSDC';
export { useContractWriteWithUSDC } from './useContractWriteWithUSDC';
export { useUSDCTransaction as useUSDCApprovalAndTransaction } from './useUSDCTransaction';
export { useUSDCTransaction as useContractWriteWithUSDC_Legacy } from './useUSDCTransaction';