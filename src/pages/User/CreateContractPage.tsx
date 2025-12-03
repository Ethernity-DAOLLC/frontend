import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRetirementPlan } from '@/context/RetirementContext';
import { useContractWriteWithUSDC } from '@/hooks/usdc';
import { useAccount, useChainId } from 'wagmi';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Wallet,
  Sparkles,
  Edit3,
} from 'lucide-react';

// Direcciones desde .env
const FACTORY_ADDRESS = import.meta.env.VITE_PERSONALFUNDFACTORY_ADDRESS as `0x${string}`;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
const EXPECTED_CHAIN_ID = 421614; // Arbitrum Sepolia

import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';

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
  const { planData, clearPlanData } = useRetirementPlan();

  const [formData, setFormData] = useState<FormData | null>(null);

  // Redirección si falta plan o wallet
  useEffect(() => {
    if (!planData || !isConnected) {
      navigate('/calculator', { replace: true });
    } else {
      setFormData(planData);
    }
  }, [planData, isConnected, navigate]);

  // Bloqueo si está en red incorrecta
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

  // Convierte dólares → USDC (6 decimales)
  const parseUSDC = (value: string | number): bigint => {
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
    BigInt(Math.round(formData.interestRate * 100)), // 5.5 → 550
    BigInt(formData.timelockYears),
  ];

  const { executeAll, isLoading, isApproving, isSuccess, error, txHash } =
    useContractWriteWithUSDC({
      contractAddress: FACTORY_ADDRESS,
      abi: PersonalFundFactoryABI,
      functionName: 'createPersonalFund',
      args,
      usdcAmount: formData.initialDeposit,
      enabled: !!address,
      onTransactionSuccess: () => {
        clearPlanData();
        setTimeout(() => navigate('/dashboard'), 4000);
      },
    });

  const formatNumber = (num: string | number) =>
    new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(Number(num));

  const totalFee = Number(formData.initialDeposit) * 0.03;
  const netToFund = Number(formData.initialDeposit) * 0.97;

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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-10 text-white">
            <h1 className="text-4xl md:text-5xl font-black flex items-center gap-4">
              <Sparkles size={56} />
              Confirmar Creación de tu Fondo
            </h1>
            <p className="mt-4 text-xl opacity-90">
              Revisa los datos y crea tu contrato inteligente de retiro en blockchain
            </p>
          </div>

          <div className="p-10 space-y-10">
            {/* Resumen de parámetros */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Parámetros del Plan</h2>
              <div className="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-8">
                {[
                  { label: 'Edad actual', value: `${formData.currentAge} años` },
                  { label: 'Edad de retiro', value: `${formData.retirementAge} años` },
                  { label: 'Ahorro inicial', value: `$${formatNumber(formData.initialDeposit)}` },
                  { label: 'Ahorro mensual', value: `$${formatNumber(formData.monthlyDeposit)}` },
                  { label: 'Ingreso mensual deseado', value: `$${formatNumber(formData.desiredMonthlyIncome)}` },
                  { label: 'Años de pago', value: `${formData.yearsPayments} años` },
                  { label: 'Tasa de interés anual', value: `${formData.interestRate}%` },
                  { label: 'Timelock (bloqueo)', value: `${formData.timelockYears} años` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-3 border-b border-gray-200 last:border-0">
                    <span className="text-gray-600 font-medium">{item.label}:</span>
                    <strong className="text-gray-800">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-emerald-800 mb-6">
                  Resumen del Depósito Inicial
                </h3>
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

              {/* Estado de transacción */}
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
                      className="underline mt-4 inline-block"
                    >
                      Ver transacción
                    </a>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                  <p className="text-red-700 font-bold">
                    Error: {(error as any)?.shortMessage || error?.message || 'Transacción fallida'}
                  </p>
                </div>
              )}
            </div>

            {/* Botón principal */}
            <div className="mt-12 text-center">
              <button
                onClick={() => executeAll()}
                disabled={isLoading || isSuccess}
                className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-3xl px-20 py-8 rounded-3xl shadow-2xl transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-6 mx-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={56} />
                    {isApproving ? 'Aprobando USDC...' : 'Creando tu fondo...'}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContractPage;