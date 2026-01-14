import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useUSDCTransaction } from '@/hooks/usdc';
import { useAccount, useChainId } from 'wagmi';
import { 
  Loader2, CheckCircle, AlertCircle, ArrowLeft, Wallet, 
  Sparkles, Edit3, AlertTriangle, ExternalLink, Droplets 
} from 'lucide-react';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';
import { formatUSDC, parseUSDC } from '@/hooks/usdc/usdcUtils';
import { getContractAddress } from '@/config/addresses';

const EXPECTED_CHAIN_ID = 421614;

function useFactoryAddress(chainId: number): `0x${string}` | undefined {
  return getContractAddress(chainId, 'personalFundFactory');
}

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
  const [isInitialized, setIsInitialized] = useState(false);
  const FACTORY_ADDRESS = useFactoryAddress(chainId);

  useEffect(() => {
    console.log('🏭 Factory Address Debug:', {
      fromEnv: import.meta.env.VITE_PERSONALFUNDFACTORY_ADDRESS,
      fromAddressesTs: FACTORY_ADDRESS,
      chainId,
      willBeUsedAsSpender: FACTORY_ADDRESS,
    });

    if (!FACTORY_ADDRESS) {
      console.error('❌ Factory address is undefined!');
    } else if (FACTORY_ADDRESS === '0xe02D1A836A2145c4A87d6f3efAFe546F789823c5') {
      console.error('❌ Factory address is still the OLD one!');
    } else if (FACTORY_ADDRESS === '0xe02D1A836A2145c4A87d6f3efAFe546F789823c5') {
      console.log('✅ Factory address is correct from .env.local');
    } else {
      console.log('ℹ️ Factory address from addresses.ts:', FACTORY_ADDRESS);
    }
  }, [FACTORY_ADDRESS, chainId]);

  useEffect(() => {
    if (!planData || !isConnected || !authConnected) {
      navigate('/calculator', { replace: true });
      return;
    }
    setFormData(planData);
    setIsInitialized(true);
  }, [planData, isConnected, authConnected, navigate]);

  const args = formData ? [
    parseUSDC(formData.initialDeposit),
    parseUSDC(formData.monthlyDeposit),
    BigInt(formData.currentAge),
    BigInt(formData.retirementAge),
    parseUSDC(formData.desiredMonthlyIncome),
    BigInt(formData.yearsPayments),
    BigInt(Math.round(formData.interestRate * 100)), 
    BigInt(formData.timelockYears),
  ] : [];

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
    userBalance,
    hasEnoughBalance,
    currentAllowance,
  } = useUSDCTransaction({
    contractAddress: FACTORY_ADDRESS!,
    abi: PersonalFundFactoryABI as any,
    functionName: 'createPersonalFund',
    args,
    usdcAmount: formData?.initialDeposit || '0',
    enabled: !!address && !!formData && !isEditing && isInitialized && !!FACTORY_ADDRESS,
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

  const totalFee = formData ? Number(formData.initialDeposit) * 0.03 : 0;
  const netToFund = formData ? Number(formData.initialDeposit) * 0.97 : 0;
  const userBalanceFormatted = formatUSDC(userBalance);
  const balanceShortfall = formData 
    ? parseFloat(formData.initialDeposit) - parseFloat(userBalanceFormatted)
    : 0;

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

  if (!FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-red-200">
          <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6" />
          <h1 className="text-4xl font-black text-red-700 mb-4">Configuración Faltante</h1>
          <p className="text-xl text-gray-700 mb-4">
            La dirección del contrato Factory no está configurada correctamente.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-left">
            <p className="text-gray-600 mb-2">Verifica en addresses.ts:</p>
            <p className="font-mono text-xs text-red-600 break-all">
              CONTRACT_ADDRESSES[421614].personalFundFactory
            </p>
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

  if (chainId !== EXPECTED_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg border border-red-200">
          <AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl font-black text-red-700 mb-4">Red Incorrecta</h1>
          <p className="text-xl text-gray-700 mb-4">
            Por favor cambia a <strong>Arbitrum Sepolia</strong> para crear tu fondo.
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

  if (!isInitialized || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
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
          disabled={isLoading}
        >
          <ArrowLeft size={22} />
          Volver a la Calculadora
        </button>

        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
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

              {/* Resumen y Estado */}
              <div className="space-y-6">
                {/* Card de Balance USDC */}
                <div className={`rounded-3xl p-6 border-2 transition-all ${
                  hasEnoughBalance 
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
                    : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                }`}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {hasEnoughBalance ? (
                      <>
                        <CheckCircle className="text-green-600" size={24} />
                        <span className="text-gray-800">Balance USDC Verificado</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="text-red-600" size={24} />
                        <span className="text-red-800">Balance USDC Insuficiente</span>
                      </>
                    )}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Tu Balance Actual:</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-2xl font-black ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                          {userBalanceFormatted} USDC
                        </span>
                        <span className="text-sm text-gray-600">
                          ≈ ${parseFloat(userBalanceFormatted).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cantidad Requerida:</span>
                        <strong className="text-xl text-gray-800">
                          {formatNumber(formData.initialDeposit)} USDC
                        </strong>
                      </div>
                    </div>
                    
                    {!hasEnoughBalance && (
                      <div className="mt-4 bg-red-100 border-2 border-red-300 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                          <div>
                            <p className="text-sm font-bold text-red-800 mb-1">
                              Balance Insuficiente
                            </p>
                            <p className="text-sm text-red-700">
                              Te faltan aproximadamente <strong>{balanceShortfall.toFixed(2)} USDC</strong>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => navigate('/calculator')}
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition text-sm"
                          >
                            <Droplets size={18} />
                            Obtener Tokens
                          </button>
                          
                          <a
                            href="https://faucet.quicknode.com/arbitrum/sepolia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition text-sm"
                          >
                            <ExternalLink size={18} />
                            Faucet Externo
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {hasEnoughBalance && requiresApproval && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <div className="bg-amber-100 rounded-full p-1.5 flex-shrink-0">
                            <AlertCircle className="text-amber-600" size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-amber-900 mb-1">
                              Aprobación Requerida
                            </p>
                            <p className="text-xs text-amber-800">
                              Allowance actual: {formatUSDC(currentAllowance || 0n)} USDC
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Se necesitarán 2 transacciones (aprobar + crear).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen del Depósito */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border-2 border-emerald-200">
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

                {/* Progress Bar */}
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
                        Paso 1/2: Aprobando USDC
                      </p>
                    )}
                    {step === 'executing' && (
                      <p className="text-sm text-blue-700 mt-3">
                        Paso {requiresApproval ? '2/2' : '1/1'}: Creando contrato
                      </p>
                    )}
                  </div>
                )}

                {/* Success */}
                {isSuccess && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 text-center">
                    <CheckCircle size={64} className="mx-auto mb-4" />
                    <h3 className="text-3xl font-black mb-2">¡Fondo Creado!</h3>
                    <p className="text-lg opacity-90">Redirigiendo al Dashboard...</p>
                    {txHash && (
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline mt-4 inline-block hover:opacity-80"
                      >
                        Ver en Arbiscan ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                      <div className="flex-1">
                        <h4 className="font-bold text-red-800 mb-2">Error en la transacción</h4>
                        <p className="text-red-700 text-sm whitespace-pre-line mb-3">{error.message}</p>
                        
                        {/* Botón para verificar dirección */}
                        <a
                          href={`https://sepolia.arbiscan.io/address/${FACTORY_ADDRESS}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          <ExternalLink size={14} />
                          Verificar Factory en Arbiscan
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Button */}
            <div className="mt-12 text-center">
              <button
                onClick={() => executeAll()}
                disabled={isLoading || isSuccess || isEditing || !hasEnoughBalance}
                className={`
                  font-black text-3xl px-20 py-8 rounded-3xl shadow-2xl 
                  transition-all transform flex items-center justify-center gap-6 mx-auto
                  ${!hasEnoughBalance 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : isLoading || isSuccess || isEditing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white hover:scale-105'
                  }
                `}
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
                ) : !hasEnoughBalance ? (
                  <>
                    <AlertTriangle size={56} />
                    Balance Insuficiente
                  </>
                ) : (
                  <>
                    <Wallet size={56} />
                    Crear Contrato
                  </>
                )}
              </button>
              {!hasEnoughBalance && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-amber-800 text-center">
                    💡 Obtén tokens USDC desde la calculadora o un faucet externo
                  </p>
                </div>
              )}
              {hasEnoughBalance && requiresApproval && !isLoading && !isSuccess && (
                <p className="mt-4 text-gray-600">
                  Se necesitarán 2 transacciones: aprobación + creación
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