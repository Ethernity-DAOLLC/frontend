import { useMemo } from 'react';
import { useToken } from './core/useToken';
import { useTreasury } from './core/useTreasury';
import { useGovernance } from './core/useGovernance';
import { usePersonalFundFactory } from './funds/usePersonalFundFactory';
import { usePersonalFund } from './funds/usePersonalFund';
import { useProtocolRegistry } from './defi/useProtocolRegistry';
import { useUserPreferences } from './defi/useUserPreferences';
import { useUSDC } from './usdc';

function getContractAddresses() {
  return {
    token: (import.meta.env.VITE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    treasury: (import.meta.env.VITE_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    governance: (import.meta.env.VITE_GOVERNANCE_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    personalFundFactory: (import.meta.env.VITE_PERSONALFUNDFACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    protocolRegistry: (import.meta.env.VITE_PROTOCOLREGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    userPreferences: (import.meta.env.VITE_USERPREFERENCES_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  };
}

export const ADDRESSES = getContractAddresses();

function validateAddresses() {
  const required = [
    'VITE_TOKEN_ADDRESS',
    'VITE_TREASURY_ADDRESS',
    'VITE_GOVERNANCE_ADDRESS',
    'VITE_PERSONALFUNDFACTORY_ADDRESS',
    'VITE_PROTOCOLREGISTRY_ADDRESS',
    'VITE_USERPREFERENCES_ADDRESS',
  ];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0 && import.meta.env.DEV) {
    console.warn('Warning: Ethernity DAO: Missing contract addresses →', missing.join(', '));
  }

  return missing.length === 0;
}

export function areAddressesConfigured(): boolean {
  return validateAddresses();
}

export function useEthernityDAO() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    areAddressesConfigured();
  }

  const token = useToken(ADDRESSES.token);
  const treasury = useTreasury(ADDRESSES.treasury);
  const governance = useGovernance(ADDRESSES.governance);
  const factory = usePersonalFundFactory(ADDRESSES.personalFundFactory);
  const personalFund = usePersonalFund(factory.userFund);
  const protocolRegistry = useProtocolRegistry(ADDRESSES.protocolRegistry);
  const userPreferences = useUserPreferences(ADDRESSES.userPreferences);
  const usdc = useUSDC();
  const isLoading = useMemo(() => {
    return (
      token.isLoading ||
      treasury.isLoading ||
      governance.isLoading ||
      factory.isLoading ||
      personalFund.isLoading ||
      protocolRegistry.isLoading ||
      userPreferences.isLoading ||
      usdc.isApproving
    );
  }, [
    token.isLoading,
    treasury.isLoading,
    governance.isLoading,
    factory.isLoading,
    personalFund.isLoading,
    protocolRegistry.isLoading,
    userPreferences.isLoading,
    usdc.isApproving,
  ]);

  const refetchAll = async () => {
    await Promise.all([
      token.refetch?.(),
      treasury.refetch?.(),
      governance.refetch?.(),
      factory.refetch?.(),
      personalFund.refetch?.(),
      protocolRegistry.refetch?.(),
      userPreferences.refetch?.(),
    ]);
  };

  return {
    token,
    treasury,
    governance,
    factory,
    personalFund,
    protocolRegistry,
    userPreferences,
    usdc,
    addresses: ADDRESSES,
    isLoading,
    isConfigured: areAddressesConfigured(),
    refetchAll,
  };
}

export function useContractAddresses() {
  return {
    addresses: ADDRESSES,
    isConfigured: areAddressesConfigured(),
  };
}
