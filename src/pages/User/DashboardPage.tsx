import React from 'react';
import { useEthernityDAO } from '@/hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Wallet, Shield, TrendingUp, DollarSign, Calendar, Clock, 
  CheckCircle, AlertCircle, ArrowRight, RefreshCw, Sparkles 
} from 'lucide-react';
import { BetaFaucet } from '@/components/web3/BetaFaucet';

const DashboardPage: React.FC = () => {
  const { 
    personalFund, 
    factory, 
    treasury, 
    token, 
    usdc, 
    isLoading, 
    refetchAll 
  } = useEthernityDAO();

  const hasFund = !!factory.userFund && factory.userFund !== '0x0000000000000000000000000000000000000000';
  const fundAddress = factory.userFund;

  const formatTimestamp = (ts: bigint | undefined) => {
    if (!ts || ts === BigInt(0)) return 'Nunca';
    const date = new Date(Number(ts) * 1000);
    return format(date, "d 'de' MMMM, yyyy - HH:mm", { locale: es });
  };

  const formatUSDC = (amount: bigint | undefined) => {
    if (!amount) return '$0';
    return usdc.formatUSDC(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-6" size={64} />
          <p className="text-2xl font-bold text-gray-700">Cargando tu Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-gray-800 mb-4 flex items-center justify-center gap-4">
            <Sparkles className="text-purple-600" size={64} />
            Tu Dashboard Ethernity
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bienvenido, <strong>{address?.slice(0, 8)}...{address?.slice(-6)}</strong>. Aquí controlas tu futuro financiero en blockchain.
          </p>
          <button
            onClick={refetchAll}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition flex items-center gap-3 mx-auto"
          >
            <RefreshCw size={24} />
            Actualizar Todo
          </button>
        </div>

        {/* Fondo Personal */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-black text-gray-800 flex items-center gap-4">
                  <Shield className="text-emerald-600" size={48} />
                  Mi Fondo Personal
                </h2>
                {hasFund ? (
                  <span className="bg-green-100 text-green-800 font-bold px-6 py-3 rounded-full text-lg">
                    <CheckCircle size={20} className="inline mr-2" />
                    Activo
                  </span>
                ) : (
                  <span className="bg-orange-100 text-orange-800 font-bold px-6 py-3 rounded-full text-lg">
                    <AlertCircle size={20} className="inline mr-2" />
                    Sin fondo
                  </span>
                )}
              </div>

              {hasFund ? (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-gray-600 text-lg mb-2">Balance Actual</p>
                      <p className="text-5xl font-black text-emerald-600">
                        {formatUSDC(personalFund.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-lg mb-2">Estado del Fondo</p>
                      <p className="text-3xl font-bold text-indigo-700">
                        {personalFund.fundInfo?.retirementStarted ? 'En Retiro' : 'Ahorrando'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                    <p className="text-gray-700 font-medium mb-2">Dirección del Fondo</p>
                    <p className="font-mono text-lg break-all text-indigo-800">
                      {fundAddress}
                    </p>
                  </div>

                  {personalFund.timelockInfo?.timelockEnd && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300">
                      <p className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                        <Clock size={24} />
                        Timelock termina el:
                      </p>
                      <p className="text-2xl font-black text-amber-700">
                        {formatTimestamp(personalFund.timelockInfo.timelockEnd)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold py-5 px-8 rounded-2xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3">
                      <DollarSign size={28} />
                      Depositar Más USDC
                    </button>
                    {!personalFund.fundInfo?.retirementStarted && (
                      <button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-5 px-8 rounded-2xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3">
                        <TrendingUp size={28} />
                        Iniciar Retiro
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Wallet className="w-32 h-32 text-gray-300 mx-auto mb-6" />
                  <p className="text-2xl text-gray-600 mb-8">Aún no tienes un fondo de retiro creado</p>
                  <button
                    onClick={() => window.location.href = '/calculator'}
                    className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xl py-6 px-12 rounded-2xl shadow-2xl transition transform hover:scale-105 flex items-center gap-4 mx-auto"
                  >
                    <Sparkles size={32} />
                    Crear Mi Fondo Ahora
                    <ArrowRight size={32} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Treasury Global + Stats */}
          <div className="space-y-8">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-8">
              <h3 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <DollarSign className="text-purple-600" size={40} />
                Treasury Global
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600">Total en Treasury</p>
                  <p className="text-4xl font-black text-purple-700">
                    {treasury.totalDeposited ? formatUSDC(treasury.totalDeposited) : '$0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Fondos creados</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {treasury.fundCount || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-8">
              <h3 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                Gobernanza
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600">Holders del Token</p>
                  <p className="text-4xl font-black text-emerald-600">
                    {token.holderCount || 0}
                  </p>
                </div>
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition">
                  Ver Propuestas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Beta Faucet */}
        <div className="max-w-4xl mx-auto">
          <BetaFaucet />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;