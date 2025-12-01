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

const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 421614);

const ADMIN_ADDRESSES: Set<string> = new Set(
  (import.meta.env.VITE_ADMIN_ADDRESS || '')
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(Boolean)
);

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
    if (!address || !isConnected) {
      setIsAdmin(false);
      setIsCheckingRole(false);
      return;
    }

    setIsCheckingRole(true);
    const normalizedAddress = address.toLowerCase();
    const hasAdminRole = ADMIN_ADDRESSES.has(normalizedAddress);
    
    setIsAdmin(hasAdminRole);
    setIsCheckingRole(false);
  }, [address, isConnected]);

  const switchToCorrectNetwork = useCallback(async () => {
    if (!switchChainAsync || isCorrectNetwork) return;
    
    try {
      setIsConnecting(true);
      await switchChainAsync({ chainId: EXPECTED_CHAIN_ID });
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to switch network');
    } finally {
      setIsConnecting(false);
    }
  }, [switchChainAsync, isCorrectNetwork]);

  // === Connect/Disconnect wrappers (para futuro uso con modal personalizado) ===
  const connect = useCallback(() => {
    // Aquí iría la apertura del modal personalizado si lo uso
    // Por ahora solo delega al ConnectKit o wagmi
  }, []);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const clearError = () => setError(null);

  const value: AuthContextType = {
    address,
    isConnected,
    isConnecting: isConnecting || wagmiConnecting,
    isDisconnected,
    chainId,
    
    connect,
    disconnect,
    
    isCorrectNetwork,
    expectedChainId: EXPECTED_CHAIN_ID,
    switchToCorrectNetwork,
    
    isAdmin,
    isCheckingRole,
    
    error,
    clearError,

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
  return { isAuthenticated: isConnected, requireAuth: connect, error };
};

export const useRequireAdmin = () => {
  const { isAdmin, isCheckingRole, isConnected } = useAuth();
  return { isAdmin, isCheckingRole, hasAdminAccess: isAdmin && !isCheckingRole && isConnected };
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