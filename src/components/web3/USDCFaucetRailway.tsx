import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { 
  Droplet, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Info,
  Clock
} from 'lucide-react';
import { getExplorerUrl } from '@/config/chains';

interface FaucetRequest {
  wallet_address: string;
  current_age: number;
  retirement_age: number;
  desired_monthly_payment: number;
  monthly_deposit: number;
  initial_amount: number;
}

interface FaucetResponse {
  success: boolean;
  transaction_hash: string | null;
  message: string;
  amount_sent: string | null;
}

interface FaucetStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_usdc_distributed: number;
}

export default function USDCFaucetRailway() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<FaucetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [stats, setStats] = useState<FaucetStats | null>(null);

  const [formData, setFormData] = useState({
    current_age: 30,
    retirement_age: 65,
    desired_monthly_payment: 2000,
    monthly_deposit: 500,
    initial_amount: 10000,
  });

  const FAUCET_API_URL = import.meta.env.VITE_FAUCET_API_URL || 'https://usdc-faucet-production.up.railway.app';
  const FAUCET_AMOUNT = '10000';

  const loadStats = async () => {
    try {
      const res = await fetch(`${FAUCET_API_URL}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleRequestTokens = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestBody: FaucetRequest = {
        wallet_address: address,
        ...formData,
      };

      const res = await fetch(`${FAUCET_API_URL}/api/request-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Request failed');
      }

      setResponse(data);
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to request tokens');
    } finally {
      setIsLoading(false);
    }
  };

  useState(() => {
    loadStats();
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner de Testnet */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800 mb-1">
              Entorno de Prueba - Arbitrum Sepolia
            </p>
            <p className="text-yellow-700">
              Estos son tokens USDC de prueba sin valor real. Úsalos para probar la aplicación.
            </p>
          </div>
        </div>
      </div>

      {/* Card Principal del Faucet */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con Gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Droplet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  USDC Test Faucet
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Obtén {FAUCET_AMOUNT} USDC de prueba gratis
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info expandible */}
        {showInfo && (
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">
              ℹ️ ¿Qué es este Faucet?
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Este servicio distribuye tokens USDC de prueba gratuitamente para que puedas experimentar con la aplicación sin arriesgar dinero real.
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Los tokens no tienen valor monetario real</p>
              <p>• Puedes solicitar {FAUCET_AMOUNT} USDC una vez cada 24 horas</p>
              <p>• Úsalos para probar depósitos y retiros</p>
              <p>• Requiere completar datos del plan de retiro</p>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-gray-600 mb-1">Por Solicitud</p>
                <p className="text-xl font-bold text-blue-700">{FAUCET_AMOUNT} USDC</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">Total Distribuido</p>
                <p className="text-xl font-bold text-green-700">
                  {stats.total_usdc_distributed.toLocaleString()} USDC
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-gray-600 mb-1">Solicitudes</p>
                <p className="text-xl font-bold text-purple-700">
                  {stats.successful_requests}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs text-gray-600 mb-1">Cooldown</p>
                <p className="text-xl font-bold text-orange-700">24h</p>
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📋 Parámetros del Plan de Retiro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Edad Actual</label>
                <input
                  type="number"
                  value={formData.current_age}
                  onChange={(e) => setFormData({...formData, current_age: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Edad de Retiro</label>
                <input
                  type="number"
                  value={formData.retirement_age}
                  onChange={(e) => setFormData({...formData, retirement_age: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Pago Mensual Deseado ($)</label>
                <input
                  type="number"
                  value={formData.desired_monthly_payment}
                  onChange={(e) => setFormData({...formData, desired_monthly_payment: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Depósito Mensual ($)</label>
                <input
                  type="number"
                  value={formData.monthly_deposit}
                  onChange={(e) => setFormData({...formData, monthly_deposit: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  step="50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 block mb-1">Monto Inicial ($)</label>
                <input
                  type="number"
                  value={formData.initial_amount}
                  onChange={(e) => setFormData({...formData, initial_amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          </div>

          {/* Wallet no conectada */}
          {!isConnected ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  Wallet No Conectada
                </p>
                <p className="text-xs text-yellow-700">
                  Conecta tu wallet para solicitar tokens USDC de prueba
                </p>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleRequestTokens}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Procesando Solicitud...
                    </>
                  ) : (
                    <>
                      <Droplet className="w-6 h-6" />
                      Solicitar {FAUCET_AMOUNT} USDC
                    </>
                  )}
                </span>
              </button>

              {/* Mensajes de estado */}
              <div className="mt-4 space-y-3">
                {/* Success */}
                {response && response.success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 mb-1">
                        ✅ ¡Tokens Enviados Exitosamente!
                      </p>
                      <p className="text-xs text-green-700 mb-2">
                        Has recibido {response.amount_sent} USDC. Podrás solicitar más en 24 horas.
                      </p>
                      {response.transaction_hash && (
                        <a
                          href={`${getExplorerUrl(chainId)}/tx/${response.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                        >
                          Ver Transacción
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        Error al Solicitar Tokens
                      </p>
                      <p className="text-xs text-red-700">
                        {error.includes('24 hours') || error.includes('wait') ? (
                          <>
                            <Clock className="w-4 h-4 inline mr-1" />
                            {error}
                          </>
                        ) : error.includes('age') ? (
                          'Por favor verifica que los datos de edad sean válidos (18-100 años y edad actual menor a edad de retiro)'
                        ) : error.includes('empty') ? (
                          'El faucet está temporalmente vacío. Por favor contacta al administrador.'
                        ) : (
                          error
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer con recursos */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Recursos Útiles
          </h3>
          <div className="space-y-2">
            <a
              href="https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Arbitrum Bridge (ETH para gas)
            </a>
            <a
              href="https://faucets.chain.link/arbitrum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Chainlink Faucet (ETH Sepolia)
            </a>
            <a
              href={`${getExplorerUrl(chainId)}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Ver tu Wallet en Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}