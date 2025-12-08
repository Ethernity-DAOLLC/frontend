import { useChainId } from 'wagmi'
import { 
  getContractAddresses, 
  getContractAddress,
  isContractDeployed,
  areMainContractsDeployed,
  getDeployedContracts,
  getPendingContracts,
  type ContractAddresses,
  type ContractName 
} from '@/config/addresses'
import { 
  isChainActive, 
  isChainSupported,
  getChainName,
  getExplorerUrl,
  getExplorerAddressUrl
} from '@/config/chains'

export function useContracts() {
  const chainId = useChainId()
  const addresses = getContractAddresses(chainId)
  const isSupported = isChainSupported(chainId)
  const isActive = isChainActive(chainId)
  const hasAllContracts = areMainContractsDeployed(chainId)
  const getAddress = (contract: ContractName): `0x${string}` | undefined => {
    return getContractAddress(chainId, contract)
  }
  const isDeployed = (contract: ContractName): boolean => {
    return isContractDeployed(chainId, contract)
  }
  const getExplorer = (txHash?: string): string => {
    return getExplorerUrl(chainId, txHash)
  }
  const getAddressExplorer = (address: string): string => {
    return getExplorerAddressUrl(chainId, address)
  }
  
  return {
    // Información básica
    chainId,
    chainName: getChainName(chainId),
    
    // Direcciones
    addresses,
    getAddress,
    
    // Estado
    isSupported,
    isActive,
    isDeployed,
    hasAllContracts,
    
    // Listas de contratos
    deployedContracts: getDeployedContracts(chainId),
    pendingContracts: getPendingContracts(chainId),
    
    // Helpers
    getExplorer,
    getAddressExplorer,
  }
}

export function useContractAddress(contract: ContractName): `0x${string}` | undefined {
  const chainId = useChainId()
  return getContractAddress(chainId, contract)
}
export function useIsContractDeployed(contract: ContractName): boolean {
  const chainId = useChainId()
  return isContractDeployed(chainId, contract)
}
export function useExplorer() {
  const chainId = useChainId()
  
  return {
    getExplorer: (txHash?: string) => getExplorerUrl(chainId, txHash),
    getAddressExplorer: (address: string) => getExplorerAddressUrl(chainId, address),
    baseUrl: getExplorerUrl(chainId),
  }
}

export function useDeploymentInfo() {
  const chainId = useChainId()
  const deployed = getDeployedContracts(chainId)
  const pending = getPendingContracts(chainId)
  const total = deployed.length + pending.length
  const progress = total > 0 ? Math.round((deployed.length / total) * 100) : 0
  
  return {
    deployed,
    pending,
    total,
    progress,
    isComplete: areMainContractsDeployed(chainId),
  }
}