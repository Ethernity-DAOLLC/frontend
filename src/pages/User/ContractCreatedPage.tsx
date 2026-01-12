import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { 
  ArrowLeft, ArrowRight, DollarSign, Calendar, 
  Sparkles, AlertCircle, CheckCircle2, Info 
} from 'lucide-react';
import { ExecutionStep } from '@/components/retirement/ExecutionStep';
import type { RetirementPlan } from '@/types/retirement_types';

interface LocationState {
  planData: RetirementPlan;
  factoryAddress: `0x${string}`;
  needsApproval: boolean;
}

const ContractCreatedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [confirmed, setConfirmed] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string>('');
  const state = location.state as LocationState;
  const { planData, factoryAddress, needsApproval } = state || {};

  useEffect(() => {
    if (!planData || !factoryAddress || !isConnected) {
      console.warn('⚠️ Missing data, redirecting to calculator');
      navigate('/calculator', { replace: true });
    }
  }, [planData, factoryAddress, isConnected, navigate]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(Number(num));
  };

  const handleTransactionSuccess = (txHash: string, fundAddress?: string) => {
    console.log('✅ Transaction successful!', { txHash, fundAddress });
    setTxSuccess(true);
    setSuccessTxHash(txHash);
    setTimeout(() => {
      navigate('/dashboard');
    }, 4000);
  };

  if (!planData || !factoryAddress) {
    return null;
  }

  const totalFee = Number(planData.initialDeposit) * 0.03;
  const netToFund = Number(planData.initialDeposit) * 0.97;

  if (txSuccess && successTxHash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-4 border-emerald-300 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-12 text-center text-white">
              <CheckCircle2 className="w-32 h-32 mx-auto mb-6 animate-bounce" />
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                ¡Contrato Creado Exitosamente! 🎉
              </h1>
              <p className="text-lg sm:text-xl opacity-90">
                Tu fondo de retiro está ahora en la blockchain
              </p>
            </div>

            <div className="p-8 sm:p-12 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-emerald-600" size={20} />
                    <p className="text-gray-600 font-semibold">Depósito Inicial</p>
                  </div>
                  <p className="text-4xl font-black text-emerald-700">
                    {formatCurrency(planData.initialDeposit)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {formatCurrency(netToFund)} netos para DeFi
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-blue-600" size={20} />
                    <p className="text-gray-600 font-semibold">Ahorro Mensual</p>
                  </div>
                  <p className="text-4xl font-black text-blue-700">
                    {formatCurrency(planData.monthlyDeposit)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Requerido para tu meta de retiro
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Sparkles className="text-purple-600" />
                  Próximos Pasos
                </h3>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Ve al Dashboard</strong> para ver los detalles y balance de tu fondo
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Realiza depósitos mensuales</strong> de {formatCurrency(planData.monthlyDeposit)} para mantenerte en camino
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-base sm:text-lg">
                    <span className="text-emerald-600 font-bold text-xl">✓</span>
                    <div>
                      <strong>Monitorea tu progreso</strong> y ajusta tu plan según sea necesario
                    </div>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
              >
                Ir al Dashboard
                <ArrowRight size={32} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-indigo-300 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 sm:p-12 text-center text-white">
            <Sparkles className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-5xl font-black mb-4">
              Confirmación Final
            </h1>
            <p className="text-base sm:text-xl opacity-90">
              Revisa cuidadosamente antes de crear tu contrato
            </p>
          </div>

          <div className="p-6 sm:p-12 space-y-8">
            {/* Warning Box */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={28} />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 text-lg mb-2">
                    ⚠️ Última Verificación
                  </h3>
                  <p className="text-amber-800 mb-3">
                    Una vez creado el contrato, <strong>no podrás modificar estos parámetros</strong>. 
                    Asegúrate de que toda la información sea correcta.
                  </p>
                  <ul className="space-y-1 text-sm text-amber-700">
                    <li>• El timelock de {planData.timelockYears} años será permanente</li>
                    <li>• Los depósitos mensuales son obligatorios para alcanzar tu meta</li>
                    <li>• El fee del 3% se deduce en cada Deposito</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Plan Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-emerald-600" size={20} />
                  <p className="text-gray-600 font-semibold">Depósito Inicial</p>
                </div>
                <p className="text-4xl font-black text-emerald-700">
                  {formatCurrency(planData.initialDeposit)}
                </p>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>Fee DAO (3%): {formatCurrency(totalFee)}</p>
                  <p className="font-semibold text-emerald-700">
                    Neto a tu fondo: {formatCurrency(netToFund)}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-blue-600" size={20} />
                  <p className="text-gray-600 font-semibold">Ahorro Mensual</p>
                </div>
                <p className="text-4xl font-black text-blue-700">
                  {formatCurrency(planData.monthlyDeposit)}
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  Durante {planData.retirementAge - planData.currentAge} años hasta el retiro
                </p>
              </div>
            </div>

            {/* Detailed Parameters */}
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Info size={20} className="text-indigo-600" />
                Parámetros del Contrato
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Edad Actual', value: `${planData.currentAge} años` },
                  { label: 'Edad de Retiro', value: `${planData.retirementAge} años` },
                  { label: 'Ingreso Mensual Deseado', value: formatCurrency(planData.desiredMonthlyIncome) },
                  { label: 'Años Recibiendo Ingresos', value: `${planData.yearsPayments} años` },
                  { label: 'Tasa de Rendimiento', value: `${planData.interestRate}% anual` },
                  { label: 'Timelock de Seguridad', value: `${planData.timelockYears} años` },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{item.label}:</span>
                    <strong className="text-gray-800">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Component */}
            {!confirmed ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-700 flex-1">
                      He revisado todos los parámetros y confirmo que son correctos. 
                      Entiendo que <strong>no podré modificar estos valores una vez creado el contrato</strong>.
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => setConfirmed(true)}
                  disabled={!confirmed}
                  className={`w-full font-black text-2xl py-6 rounded-2xl shadow-xl transition-all transform ${
                    confirmed
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {confirmed ? 'Proceder a Crear Contrato' : 'Confirma para Continuar'}
                </button>
                <button
                  onClick={() => navigate('/create-contract')}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Volver a Revisión
                </button>
              </div>
            ) : (
              <ExecutionStep
                plan={planData}
                factoryAddress={factoryAddress}
                needsApproval={needsApproval}
                onSuccess={handleTransactionSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCreatedPage;