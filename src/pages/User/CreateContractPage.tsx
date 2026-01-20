import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useAccount, useChainId } from 'wagmi';
import { useHasFund } from '@/hooks/funds/useHasFund';
import { 
  ArrowLeft, ArrowRight, Sparkles, Edit3, AlertCircle, CheckCircle, Info
} from 'lucide-react';
import { getContractAddress } from '@/config/addresses';
import { VerificationStep } from '@/components/retirement/VerificationStep';
import { formatErrorForUI } from '@/utils/contractErrorParser';

const EXPECTED_CHAIN_ID = 421614;

function useFactoryAddress(chainId: number): `0x${string}` | undefined {
  return getContractAddress(chainId, 'personalFundFactory');
}

interface FormData {
  principal: string;
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
  const { planData } = useRetirementPlan();
  const { hasFund, fundAddress, isLoading: isLoadingFund } = useHasFund();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);
  const FACTORY_ADDRESS = useFactoryAddress(chainId);

  useEffect(() => {
    if (!planData || !isConnected || !authConnected) {
      navigate('/calculator', { replace: true });
      return;
    }
    setFormData(planData);
    setIsInitialized(true);
  }, [planData, isConnected, authConnected, navigate]);

  useEffect(() => {
    if (hasFund && fundAddress) {
      console.warn('⚠️ User already has a fund:', fundAddress);
    }
  }, [hasFund, fundAddress]);

  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(Number(num));
  };

  const totalFee = formData ? Number(formData.initialDeposit) * 0.03 : 0;
  const netToFund = formData ? Number(formData.initialDeposit) * 0.97 : 0;
  const handleVerificationComplete = (requiresApproval: boolean) => {
    setVerificationPassed(true);
    setNeedsApproval(requiresApproval);
  };

  const handleContinueToConfirmation = () => {
    if (!formData || !FACTORY_ADDRESS) return;

    if (hasFund) {
      alert('Ya tienes un fondo creado. No puedes crear más de uno por wallet.');
      navigate('/dashboard');
      return;
    }
    
    navigate('/contract-created', {
      state: {
        planData: formData,
        factoryAddress: FACTORY_ADDRESS,
        needsApproval
      }
    });
  };

  if (!FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-red-200">
          <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6" />
          <h1 className="text-4xl font-black text-red-700 mb-4">Configuración Faltante</h1>
          <p className="text-xl text-gray-700 mb-4">
            La dirección del contrato Factory no está configurada correctamente.
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

  if (chainId !== EXPECTED_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-red-200">
          <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-red-700 mb-4">Red Incorrecta</h1>
          <p className="text-xl text-gray-700 mb-4">
            Por favor cambia a <strong>Arbitrum Sepolia</strong> para continuar.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-left">
            <p className="text-gray-600 mb-1">Red actual:</p>
            <p className="font-mono font-bold text-gray-800">Chain ID: {chainId}</p>
            <p className="text-gray-600 mt-3 mb-1">Red requerida:</p>
            <p className="font-mono font-bold text-emerald-600">Arbitrum Sepolia (421614)</p>
          </div>
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

  if (hasFund && fundAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-amber-300">
          <Info className="w-24 h-24 text-amber-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-amber-700 mb-4">Ya Tienes un Fondo</h1>
          <p className="text-xl text-gray-700 mb-6">
            Solo puedes tener un fondo de retiro por wallet.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
            <p className="text-gray-600 mb-2">Tu fondo existente:</p>
            <p className="font-mono text-xs text-gray-800 break-all">
              {fundAddress}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-5 px-10 rounded-2xl text-xl transition w-full mb-3"
          >
            Ir al Dashboard
          </button>
          <button
            onClick={() => navigate('/calculator')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 px-8 rounded-xl text-lg transition w-full"
          >
            Volver a Calculadora
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized || !formData || isLoadingFund) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Cargando datos del plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
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
              Revisión del Plan
            </h1>
            <p className="text-xl opacity-90">Verifica que todo esté correcto antes de continuar</p>
          </div>

          <div className="p-10">
            <div className="grid lg:grid-cols-2 gap-10">
              {/* LEFT: Parámetros del Plan */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">Parámetros del Fondo</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Edit3 size={20} />
                    {isEditing ? 'Guardar' : 'Editar'}
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

                {/* Resumen del Depósito */}
                <div className="mt-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border-2 border-emerald-200">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-6">Resumen del Depósito</h3>
                  <div className="space-y-5 text-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total a depositar:</span>
                      <strong className="text-3xl font-black text-emerald-700">
                        ${formatNumber(formData.initialDeposit)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Fee DAO (3%):</span>
                      <strong>${formatNumber(totalFee)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-700 text-2xl font-bold pt-4 border-t-2 border-emerald-200">
                      <span>Neto a tu fondo:</span>
                      <strong>${formatNumber(netToFund)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Verificación */}
              <div className="space-y-6">
                <VerificationStep 
                  plan={formData} 
                  onVerificationComplete={handleVerificationComplete}
                />

                {verificationPassed && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-start gap-4 mb-4">
                      <CheckCircle className="text-blue-600 flex-shrink-0 mt-1" size={32} />
                      <div>
                        <h3 className="text-xl font-bold text-blue-800 mb-2">
                          ✓ Verificación Completada
                        </h3>
                        <p className="text-blue-700">
                          Todos los requisitos han sido cumplidos. Puedes continuar a la confirmación final.
                        </p>
                      </div>
                    </div>

                    {needsApproval && (
                      <div className="bg-amber-50 rounded-xl p-4 mt-4">
                        <p className="text-sm text-amber-800">
                          ℹ️ Se requerirán <strong>2 transacciones</strong>: aprobación de USDC y creación del contrato.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="mt-12 space-y-4">
              <button
                onClick={handleContinueToConfirmation}
                disabled={!verificationPassed || isEditing || hasFund}
                className={`
                  w-full font-black text-3xl px-20 py-8 rounded-3xl shadow-2xl 
                  transition-all transform flex items-center justify-center gap-6
                  ${!verificationPassed || isEditing || hasFund
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white hover:scale-105'
                  }
                `}
              >
                {hasFund ? (
                  <>
                    <AlertCircle size={56} />
                    Ya Tienes un Fondo
                  </>
                ) : !verificationPassed ? (
                  <>
                    <AlertCircle size={56} />
                    Completa la Verificación
                  </>
                ) : (
                  <>
                    Continuar a Confirmación
                    <ArrowRight size={56} />
                  </>
                )}
              </button>

              {!verificationPassed && !hasFund && (
                <p className="text-center text-gray-600 text-sm">
                  Asegúrate de tener suficiente balance de USDC y gas antes de continuar
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
