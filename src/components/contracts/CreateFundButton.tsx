import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { 
  Wallet, 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Sparkles 
} from 'lucide-react';
import { useRetirementPlan } from '@/context/RetirementContext';

interface RetirementPlanData {
  initialDeposit: string;
  monthlyDeposit: string;
  currentAge: number;
  retirementAge: number;
  desiredMonthlyIncome: number;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}

type ButtonMode = 'navigate' | 'execute';
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface CreateFundButtonProps {

  mode: ButtonMode;

  planData?: RetirementPlanData;

  onExecute?: () => void;

  isLoading?: boolean;
  isApproving?: boolean;
  isSuccess?: boolean;
  error?: Error | null;

  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;

  onConnectRequired?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;

  children?: React.ReactNode;
}

export const CreateFundButton: React.FC<CreateFundButtonProps> = ({
  mode,
  planData,
  onExecute,
  isLoading = false,
  isApproving = false,
  isSuccess = false,
  error = null,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  className = '',
  onConnectRequired,
  onSuccess: onSuccessCallback,
  onError,
  children,
}) => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { setPlanData } = useRetirementPlan();

  const handleNavigateMode = () => {
    if (!planData) {
      console.error('❌ No hay datos del plan para guardar');
      return;
    }

    if (!isConnected || !address) {
      console.log('⚠️  Wallet no conectada, notificando...');
      onConnectRequired?.();
      return;
    }

    setPlanData(planData);
    console.log('✅ Plan guardado:', planData);

    navigate('/create-contract');
  };

  const handleExecuteMode = () => {
    if (!onExecute) {
      console.error('❌ onExecute no está definido en modo execute');
      return;
    }

    if (!isConnected || !address) {
      console.error('❌ Wallet no conectada');
      onConnectRequired?.();
      return;
    }

    onExecute();
  };

  const handleClick = () => {
    if (disabled || isLoading || isSuccess) return;

    if (mode === 'navigate') {
      handleNavigateMode();
    } else if (mode === 'execute') {
      handleExecuteMode();
    }
  };

  const getButtonContent = () => {
    if (mode === 'navigate') {
      if (!isConnected) {
        return (
          <>
            <Wallet className="w-8 h-8 md:w-10 md:h-10" />
            <span>Conectar Wallet y Crear Contrato</span>
            <ArrowRight className="w-8 h-8 md:w-10 md:h-10" />
          </>
        );
      }

      return (
        <>
          <CheckCircle className="w-8 h-8 md:w-10 md:h-10" />
          <span>Crear Mi Contrato en Blockchain</span>
          <ArrowRight className="w-8 h-8 md:w-10 md:h-10" />
        </>
      );
    }

    if (mode === 'execute') {
      if (isSuccess) {
        return (
          <>
            <CheckCircle className="w-10 h-10 md:w-14 md:h-14" />
            <span>¡Fondo Creado!</span>
          </>
        );
      }

      if (isLoading) {
        return (
          <>
            <Loader2 className="w-10 h-10 md:w-14 md:h-14 animate-spin" />
            <span>{isApproving ? 'Aprobando USDC...' : 'Creando tu fondo...'}</span>
          </>
        );
      }

      if (error) {
        return (
          <>
            <AlertCircle className="w-10 h-10 md:w-14 md:h-14" />
            <span>Error - Reintentar</span>
          </>
        );
      }

      return (
        <>
          <Sparkles className="w-10 h-10 md:w-14 md:h-14" />
          <span>Crear Mi Contrato en Blockchain</span>
        </>
      );
    }

    return children || <span>Crear Fondo</span>;
  };

  const getVariantStyles = (): string => {
    if (isSuccess) {
      return 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700';
    }

    if (error) {
      return 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700';
    }

    switch (variant) {
      case 'primary':
        return 'from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800';
      case 'secondary':
        return 'from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800';
      case 'ghost':
        return 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800';
      default:
        return 'from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-base px-6 py-3 gap-2';
      case 'md':
        return 'text-lg px-8 py-4 gap-3';
      case 'lg':
        return 'text-xl px-10 py-5 gap-4';
      case 'xl':
        return 'text-2xl md:text-3xl px-12 py-6 md:px-20 md:py-8 gap-4 md:gap-6';
      default:
        return 'text-xl px-10 py-5 gap-4';
    }
  };

  const baseStyles = `
    bg-gradient-to-r ${getVariantStyles()}
    disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
    text-white font-black rounded-2xl md:rounded-3xl
    shadow-2xl transition-all transform
    hover:scale-105 disabled:scale-100 disabled:opacity-60
    flex items-center justify-center
    ${getSizeStyles()}
    ${className}
  `;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading || isSuccess}
      className={baseStyles}
      type="button"
    >
      {getButtonContent()}
    </button>
  );
};

export default CreateFundButton;

export type {
  CreateFundButtonProps,
  RetirementPlanData,
  ButtonMode,
  ButtonVariant,
  ButtonSize,
};