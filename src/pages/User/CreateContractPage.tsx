import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useUSDCTransaction } from '@/hooks/usdc';
import { useAccount, useChainId } from 'wagmi';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Wallet, Sparkles, Edit3 } from 'lucide-react';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';

const FACTORY_ADDRESS = import.meta.env.VITE_PERSONALFUNDFACTORY_ADDRESS as `0x${string}`;
const EXPECTED_CHAIN_ID = 421614;

interface FormData {
  initialDeposit: string;
  monthlyDeposit: string;
  currentAge: number;
  retirementAge: number;
  desiredMonthlyIncome: number;
  yearsPayments: number;
  interestRate: number;
  timelockYears: number;
}

const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { isConnected: authConnected } = useAuth();
  const { planData, clearPlanData } = useRetirementPlan();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  useEffect(() => {
    if (!planData || !isConnected || !authConnected) {
      navigate('/calculator', { replace: true });
      return;
    }
    setFormData(planData);
  }, [planData, isConnected, authConnected, navigate]);

  if (chainId !== EXPECTED_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-red-200">
          <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-red-700 mb-4">Red Incorrecta</h1>
          <p className="text-xl text-gray-700 mb-8">
            Por favor cambia a <strong>Arbitrum Sepolia</strong> para crear tu fondo.
          </p>
          <button
            onClick={() => navigate('/calculator')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-5 px-10 rounded-2xl text-xl transition"
          >
            Volver a la Calculadora
          </button>
        </div>
      </div>
    );
  }
  if (!formData) return null;

  const parseUSDC = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return BigInt(Math.round(num * 1_000_000));
  };

  const args = [
    parseUSDC(formData.initialDeposit),
    parseUSDC(formData.monthlyDeposit),
    BigInt(formData.currentAge),
    BigInt(formData.retirementAge),
    parseUSDC(formData.desiredMonthlyIncome),
    BigInt(formData.yearsPayments),
    BigInt(Math.round(formData.interestRate * 100)), 
    BigInt(formData.timelockYears),
  ];
  const {
    executeAll,
    isLoading,
    isApproving,
    isSuccess,
    error,
    txHash,
    step,
    progress,
    requiresApproval,
  } = useUSDCTransaction({
    contractAddress: FACTORY_ADDRESS,
    abi: PersonalFundFactoryABI as any,
    functionName: 'createPersonalFund',
    args,
    usdcAmount: formData.initialDeposit,
    enabled: !!address && !isEditing,
    autoExecuteAfterApproval: true,
    onTransactionSuccess: () => {
      console.log('✅ Transaction successful, redirecting...');
      clearPlanData();
      setTimeout(() => navigate('/dashboard'), 4000);
    },
    onError: (err) => {
      console.error('❌ Transaction error:', err);
    },
  });
  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(Number(num));
  };
  const totalFee = Number(formData.initialDeposit) * 0.03;
  const netToFund = Number(formData.initialDeposit) * 0.97;
  const getStatusMessage = () => {
    switch (step) {
      case 'checking':
        return 'Verificando balances...';
      case 'approving':
        return 'Aprobando USDC...';
      case 'approved':
        return 'USDC aprobado ✓';
      case 'executing':
        return 'Creando tu fondo...';
      case 'confirming':
        return 'Confirmando transacción...';
      case 'success':
        return '¡Fondo creado exitosamente!';
      case 'error':
        return 'Error en la transacción';
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Botón volver */}
        <button
          onClick={() => navigate('/calculator')}
          className="mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition"
        >
          <ArrowLeft size={22} />
          Volver a la Calculadora
        </button>

        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-10 text-white text-center">
            <h1 className="text-5xl font-black mb-4 flex items-center justify-center gap-5">
              <Sparkles className="w-14 h-14 animate-pulse" />
              Crear Tu Fondo de Retiro
            </h1>
            <p className="text-xl opacity-90">Contrato inteligente personalizado en blockchain</p>
          </div>

          <div className="p-10">
            <div className="grid lg:grid-cols-2 gap-10">
              {/* Parámetros */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">Parámetros del Fondo</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
                    disabled={isLoading}
                  >
                    <Edit3 size={20} />
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </button>
                </div>

                <div className="space-y-5 text-lg bg-gray-50 rounded-2xl p-6">
                  {[
                    { label: 'Depósito Inicial', value: `$${formatNumber(formData.initialDeposit)}` },
                    { label: 'Ahorro Mensual', value: `$${formatNumber(formData.monthlyDeposit)}` },
                    { label: 'Edad Actual', value: `${formData.currentAge} años` },
                    { label: 'Edad de Retiro', value: `${formData.retirementAge} años` },
                    { label: 'Ingreso Mensual Deseado', value: `$${formatNumber(formData.desiredMonthlyIncome)}` },
                    { label: 'Años Recibiendo Ingresos', value: `${formData.yearsPayments} años` },
                    { label: 'Tasa de Rendimiento', value: `${formData.interestRate}% anual` },
                    { label: 'Timelock de Seguridad', value: `${formData.timelockYears} años` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-3 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600 font-medium">{item.label}:</span>
                      <strong className="text-gray-800">{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-6">Resumen del Depósito Inicial</h3>
                  <div className="space-y-5 text-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total a depositar hoy:</span>
                      <strong className="text-3xl font-black text-emerald-700">
                        ${formatNumber(formData.initialDeposit)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Fee Ethernity DAO (3%):</span>
                      <strong>${formatNumber(totalFee)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-700 text-2xl font-bold pt-4 border-t-2 border-emerald-200">
                      <span>Neto a tu fondo (97%):</span>
                      <strong>${formatNumber(netToFund)}</strong>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                {isLoading && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-800 font-semibold">{getStatusMessage()}</span>
                      <span className="text-blue-600 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {requiresApproval && step === 'approving' && (
                      <p className="text-sm text-blue-700 mt-3">
                        Paso 1/2: Aprobando USDC para el contrato
                      </p>
                    )}
                    {step === 'executing' && (
                      <p className="text-sm text-blue-700 mt-3">
                        Paso 2/2: Creando tu contrato de retiro
                      </p>
                    )}
                  </div>
                )}
                {isSuccess && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 text-center">
                    <CheckCircle size={64} className="mx-auto mb-4" />
                    <h3 className="text-3xl font-black mb-2">¡Fondo Creado Exitosamente!</h3>
                    <p className="text-lg opacity-90">Redirigiendo al Dashboard en 4 segundos...</p>
                    {txHash && (
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline mt-4 inline-block hover:text-green-100"
                      >
                        Ver transacción en Arbiscan
                      </a>
                    )}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                      <div className="flex-1">
                        <h4 className="font-bold text-red-800 mb-1">Error en la transacción</h4>
                        <p className="text-red-700 text-sm">{error.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón principal */}
            <div className="mt-12 text-center">
              <button
                onClick={() => executeAll()}
                disabled={isLoading || isSuccess || isEditing}
                className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-3xl px-20 py-8 rounded-3xl shadow-2xl transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-6 mx-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={56} />
                    {getStatusMessage()}
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle size={56} />
                    ¡Fondo Creado!
                  </>
                ) : (
                  <>
                    <Wallet size={56} />
                    Crear Mi Contrato en Blockchain
                  </>
                )}
              </button>

              {!isLoading && !isSuccess && requiresApproval && (
                <p className="mt-4 text-gray-600">
                  Se requerirán 2 transacciones: aprobación de USDC y creación del fondo
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContractPage;