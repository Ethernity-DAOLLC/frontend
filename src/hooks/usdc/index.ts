export {
  USDC_DECIMALS,
  USDC_MIN_AMOUNT,
  USDC_MAX_AMOUNT,
  USDC_PRESETS,
  getUSDCAddress,
  useUSDCAddress,
  getFaucetAddress,
  useFaucetAddress,
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
  isFaucetAddress,
} from './usdcUtils';

export type { USDCPreset } from './usdcUtils';

export {
  useUSDC,
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