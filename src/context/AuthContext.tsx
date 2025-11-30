import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';

interface AuthContextType {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  chainId: number | undefined;

  connect: () => void;
  disconnect: () => void;

  isCorrectNetwork: boolean;
  expectedChainId: number;
  switchToCorrectNetwork: () => Promise<void>;

  isAdmin: boolean;
  isCheckingRole: boolean;

  error: string | null;
  clearError: () => void;

  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const EXPECTED_CHAIN_ID = 421614;

const ADMIN_ADDRESSES: Set<string> = new Set([
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'.toLowerCase(),
]);

const NETWORK_CONFIG = {
  chainId: EXPECTED_CHAIN_ID,
  name: 'Arbitrum Sepolia',
  rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const { 
    address, 
    isConnected, 
    isConnecting: wagmiConnecting,
    isDisconnected,
  } = useAccount();
  
  const chainId = useChainId();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const isCorrectNetwork = chainId === EXPECTED_CHAIN_ID;

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!address) {
        setIsAdmin(false);
        setIsCheckingRole(false);
        return;
      }

      setIsCheckingRole(true);

      try {
        const isAdminLocal = ADMIN_ADDRESSES.has(address.toLowerCase());
        setIsAdmin(isAdminLocal);

        // In production, check against smart contract:
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        // const hasRole = await contract.hasRole(ADMIN_ROLE, address);
        // setIsAdmin(hasRole);

      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkAdminRole();
  }, [address]);

  const switchToCorrectNetwork = useCallback(async () => {
    if (!switchChainAsync) {
      setError('Network switching is not supported by your wallet.');
      return;
    }

    try {
      setError(null);
      await switchChainAsync({ chainId: EXPECTED_CHAIN_ID });
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      
      if (err.code === 4902) {
        setError(`Please add ${NETWORK_CONFIG.name} network to your wallet manually.`);
      } else if (err.code === 4001) {
        setError('Network switch rejected. Please switch manually.');
      } else {
        setError(`Failed to switch to ${NETWORK_CONFIG.name}. Please switch manually.`);
      }
      throw err;
    }
  }, [switchChainAsync]);

  const connect = useCallback(() => {
    setError(null);
    setIsModalOpen(true);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    if (isConnected) {
      setIsConnecting(false);
      setIsModalOpen(false);

      if (chainId !== EXPECTED_CHAIN_ID) {
        console.warn(`Connected to chain ${chainId}, but expected ${EXPECTED_CHAIN_ID}`);

        switchToCorrectNetwork().catch(err => {
          console.error('Failed to auto-switch network:', err);
          setError(
            `You're on the wrong network. Please switch to ${NETWORK_CONFIG.name} manually.`
          );
        });
      }
    }
  }, [isConnected, chainId, switchToCorrectNetwork]);

  const disconnect = useCallback(() => {
    try {
      wagmiDisconnect();
      setError(null);
      setIsAdmin(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Disconnect failed:', err);
      setError('Failed to disconnect wallet. Please try again.');
    }
  }, [wagmiDisconnect]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[AuthContext] State:', {
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
        isConnected,
        chainId,
        isCorrectNetwork,
        isAdmin,
        isModalOpen,
        error,
      });
    }
  }, [address, isConnected, chainId, isCorrectNetwork, isAdmin, isModalOpen, error]);

  const value: AuthContextType = {
    address,
    isConnected,
    isConnecting: isConnecting || wagmiConnecting,
    isDisconnected,
    chainId,
    
    // Methods
    connect,
    disconnect,
    
    // Network
    isCorrectNetwork,
    expectedChainId: EXPECTED_CHAIN_ID,
    switchToCorrectNetwork,
    
    // Roles
    isAdmin,
    isCheckingRole,
    
    // Errors
    error,
    clearError,

    // Modal
    isModalOpen,
    openModal,
    closeModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useRequireAuth = () => {
  const { isConnected, connect, error } = useAuth();
  return {
    isAuthenticated: isConnected,
    requireAuth: connect,
    error,
  };
};

export const useRequireAdmin = () => {
  const { isAdmin, isCheckingRole, isConnected } = useAuth();
  return {
    isAdmin,
    isCheckingRole,
    hasAdminAccess: isAdmin && !isCheckingRole && isConnected,
  };
};

export const useRequireNetwork = () => {
  const { isCorrectNetwork, chainId, expectedChainId, switchToCorrectNetwork } = useAuth();
  return {
    isCorrectNetwork,
    currentChainId: chainId,
    expectedChainId,
    needsNetworkSwitch: !isCorrectNetwork,
    switchNetwork: switchToCorrectNetwork,
  };
};

export const useIsPublicUser = () => {
  const { isConnected } = useAuth();
  return !isConnected;
};

export default AuthProvider;