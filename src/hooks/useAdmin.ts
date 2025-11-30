import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAdmin: () => boolean;
}

export const useAdmin = (): UseAdminResult => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const VALID_ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

  const checkAdmin = useCallback((): boolean => {
    if (!VALID_ADMIN_TOKEN) {
      console.error('VITE_ADMIN_TOKEN no está definido en .env');
      return false;
    }

    const storedToken = localStorage.getItem('admin_token');
    const valid = storedToken === VALID_ADMIN_TOKEN;

    setIsAdmin(valid);
    return valid;
  }, [VALID_ADMIN_TOKEN]);

  const login = useCallback((token: string) => {
    if (token === VALID_ADMIN_TOKEN) {
      localStorage.setItem('admin_token', token);
      setIsAdmin(true);
      console.log('Admin login exitoso');
    } else {
      console.warn('Intento de login con token inválido');
    }
  }, [VALID_ADMIN_TOKEN]);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
    navigate('/admin/login');
    console.log('Admin logout');
  }, [navigate]);

  useEffect(() => {
    checkAdmin();
    setIsLoading(false);
  }, [checkAdmin]);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        console.warn('Acceso denegado a ruta admin');
        navigate('/admin/login', { replace: true });
      }
    }
  }, [isAdmin, isLoading, navigate]);

  return {
    isAdmin,
    isLoading,
    login,
    logout,
    checkAdmin,
  };
};