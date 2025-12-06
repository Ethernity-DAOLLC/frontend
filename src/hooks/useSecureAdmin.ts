import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useSignMessage } from 'wagmi';
import { z } from 'zod';

const AdminSessionSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(132).max(132),
  timestamp: z.number().positive(),
  expiresAt: z.number().positive(),
  message: z.string(),
});

type AdminSession = z.infer<typeof AdminSessionSchema>;

const ADMIN_SESSION_KEY = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas en ms
const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'; // ADMIN_ROLE del contrato

const ADMIN_ADDRESSES = new Set([
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'.toLowerCase(),
]);

function getStoredSession(): AdminSession | null {
  try {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const validated = AdminSessionSchema.parse(parsed);

    if (Date.now() > validated.expiresAt) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return validated;
  } catch (error) {
    console.error('Invalid admin session in localStorage:', error);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

function saveSession(session: AdminSession): void {
  try {
    AdminSessionSchema.parse(session); 
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save admin session:', error);
    throw new Error('Invalid session data');
  }
}

function generateLoginMessage(address: string): string {
  const timestamp = Date.now();
  return `🔐 ADMIN LOGIN - READ CAREFULLY 🔐

⚠️ IMPORTANT SECURITY NOTICE:
- This signature does NOT give access to your funds
- This signature does NOT authorize transactions
- This signature ONLY authenticates you in the admin panel
- This signature will expire in 24 hours

Address: ${address}
Timestamp: ${timestamp}
Nonce: ${Math.random().toString(36).substring(7)}
Domain: ${window.location.hostname}

By signing this message, you confirm you understand the above and are authenticating as an admin.`;
}


function isAdminAddress(address: string): boolean {
  return ADMIN_ADDRESSES.has(address.toLowerCase());
}

interface UseSecureAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

export const useSecureAdmin = (): UseSecureAdminResult => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const checkStoredSession = useCallback(() => {
    if (!address || !isConnected) {
      setIsAdmin(false);
      setIsAuthenticated(false);
      return false;
    }

    const session = getStoredSession();

    if (!session) {
      setIsAdmin(false);
      setIsAuthenticated(false);
      return false;
    }

    if (session.address.toLowerCase() !== address.toLowerCase()) {
      console.warn('Session address mismatch');
      localStorage.removeItem(ADMIN_SESSION_KEY);
      setIsAdmin(false);
      setIsAuthenticated(false);
      return false;
    }

    const stillAdmin = isAdminAddress(address);
    setIsAdmin(stillAdmin);
    setIsAuthenticated(stillAdmin);

    return stillAdmin;
  }, [address, isConnected]);

  const login = useCallback(async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isAdminAddress(address)) {
        throw new Error('Address is not authorized as admin');
      }
      const message = generateLoginMessage(address);
      const signature = await signMessageAsync({ message });
      const session: AdminSession = {
        address: address.toLowerCase(),
        signature,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        message,
      };

      saveSession(session);
      setIsAdmin(true);
      setIsAuthenticated(true);
      console.log('✅ Admin login successful');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login failed:', err);

      if (err.message?.includes('User rejected')) {
        setError('Signature rejected. Please approve the signature to login.');
      } else if (err.message?.includes('not authorized')) {
        setError('Your address is not authorized as admin.');
      } else {
        setError(err.message || 'Failed to login. Please try again.');
      }

      setIsAdmin(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, signMessageAsync, navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
    setIsAuthenticated(false);
    setError(null);
    navigate('/admin/login');
    console.log('🔓 Admin logout');
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const hasValidSession = checkStoredSession();
    setIsLoading(false);

    if (import.meta.env.DEV) {
      console.log('[useSecureAdmin] Session check:', {
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
        hasValidSession,
        isAdmin: hasValidSession,
      });
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        console.warn('⚠️ Unauthorized access attempt to admin route');
        navigate('/admin/login', { replace: true });
      }
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      setIsAdmin(false);
      setIsAuthenticated(false);
      setError(null);
      navigate('/admin/login');
    }
  }, [isConnected, isAuthenticated, navigate]);

  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    login,
    logout,
    error,
    clearError,
  };
};

// ============================================================================
// HOOK PARA VERIFICACIÓN ON-CHAIN (FUTURO)
// ============================================================================

/**
 * TODO: Implementar verificación de roles on-chain
 * 
 * import { useReadContract } from 'wagmi';
 * 
 * export const useAdminRoleOnChain = (address?: `0x${string}`) => {
 *   const { data: hasRole, isLoading } = useReadContract({
 *     address: GOVERNANCE_ADDRESS,
 *     abi: GovernanceABI,
 *     functionName: 'hasRole',
 *     args: [ADMIN_ROLE, address],
 *     enabled: !!address,
 *   });
 *   return { isAdmin: hasRole ?? false, isLoading };
 * };
 */