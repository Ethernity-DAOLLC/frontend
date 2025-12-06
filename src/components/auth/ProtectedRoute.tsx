import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, Wallet, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireAuth = true,
}) => {
  const navigate = useNavigate();
  const { isConnected, isAdmin, isCheckingRole, connect } = useAuth();

  const goHome = () => navigate('/');
  const goDashboard = () => navigate('/dashboard');
  const goCalculator = () => navigate('/calculator');

  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
          <p className="text-xl font-medium text-gray-700">Verificando permisos de acceso...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 text-center border border-purple-100">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-8">
            <Wallet className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Conecta tu Wallet
          </h1>
          <p className="text-gray-600 mb-10 leading-relaxed">
            Necesitas conectar tu wallet para acceder a esta sección y crear tu fondo de retiro personalizado.
          </p>

          <button
            onClick={connect}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3 mb-6"
          >
            <Wallet size={24} />
            Conectar Wallet
          </button>

          <button
            onClick={goCalculator}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-3 flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft size={20} />
            Volver a la Calculadora
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 text-center border border-red-100">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-8">
            <Shield className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Acceso Restringido
          </h1>
          <p className="text-gray-600 mb-6">
            Esta sección está reservada exclusivamente para miembros del <strong>Treasury Team</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            Solo los administradores autorizados pueden gestionar el treasury y las propuestas.
          </p>

          <button
            onClick={goDashboard}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-5 px-8 rounded-2xl transition-all transform hover:scale-105 shadow-xl mb-4"
          >
            Ir al Dashboard de Usuario
          </button>

          <button
            onClick={goHome}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-3 flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft size={20} />
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
