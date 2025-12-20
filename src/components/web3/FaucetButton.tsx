'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useFaucet } from '@/hooks/web3/useFaucet';
import { FaucetResponse } from '@/lib/faucet-client';
import { useChainConfig } from '@/config/chains.config';
import { Loader2, Droplets, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface FaucetButtonProps {
  currentAge?: number;
  retirementAge?: number;
  desiredMonthlyPayment?: number;
  monthlyDeposit?: number;
  initialAmount?: number;
  className?: string;
}

export function FaucetButton({
  currentAge = 30,
  retirementAge = 65,
  desiredMonthlyPayment = 3000,
  monthlyDeposit = 500,
  initialAmount = 10000,
  className = '',
}: FaucetButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { config, hasFaucet, faucetUrl, isTestnet } = useChainConfig();
  const { requestTokens, loading, error } = useFaucet(faucetUrl);
  const [result, setResult] = useState<FaucetResponse | null>(null);
  const handleRequest = async () => {
    if (!address || !isConnected || !faucetUrl) return;

    try {
      const requestData = {
        wallet_address: address,
        current_age: currentAge,
        retirement_age: retirementAge,
        desired_monthly_payment: desiredMonthlyPayment,
        monthly_deposit: monthlyDeposit,
        initial_amount: initialAmount,
      };

      console.log('🚀 Requesting tokens with data:', requestData);
      const response = await requestTokens(requestData);
      console.log('✅ Tokens received:', response);
      setResult(response);
      
      setTimeout(() => setResult(null), 20000);
    } catch (err) {
      console.error('❌ Faucet error:', err);
    }
  };

  if (!hasFaucet || !isTestnet) {
    return (
      <div className={`text-center p-6 bg-blue-50 border-2 border-blue-200 rounded-xl ${className}`}>
        <Info className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <p className="text-blue-900 font-semibold mb-2">
          {!isTestnet ? 'Producción: Usa USDC real' : 'Faucet no disponible'}
        </p>
        <p className="text-sm text-blue-700">
          {!isTestnet 
            ? 'Estás en mainnet. Usa USDC real para crear tu fondo de retiro.'
            : `El faucet no está disponible en ${config?.name || 'esta red'}.`
          }
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`text-center p-6 bg-amber-50 border-2 border-amber-200 rounded-xl ${className}`}>
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <p className="text-amber-900 font-semibold mb-2">Wallet no conectada</p>
        <p className="text-sm text-amber-700">
          Conecta tu wallet usando el botón superior para continuar
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Button */}
      <button
        onClick={handleRequest}
        disabled={loading}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 
                   text-white rounded-xl font-semibold text-lg
                   hover:from-blue-700 hover:to-indigo-700 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-lg hover:shadow-xl
                   flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando transacción...
          </>
        ) : (
          <>
            <Droplets className="w-5 h-5" />
            Solicitar Tokens de Prueba
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">Error al solicitar tokens</p>
              <p className="text-sm text-red-700">{error}</p>
              
              {error.includes('No se pudo conectar') && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <p className="text-xs text-red-900 font-semibold mb-2">
                    💡 Posibles soluciones:
                  </p>
                  <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                    <li>Verifica que el backend esté corriendo</li>
                    <li>Revisa la consola del navegador (F12) para más detalles</li>
                  </ul>
                </div>
              )}
              
              {error.includes('24 hours') && (
                <div className="mt-2 flex items-start gap-2">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    Ya solicitaste tokens recientemente. Espera 24 horas desde tu última solicitud.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {result && result.success && (
        <div className="p-5 bg-green-50 border-2 border-green-300 rounded-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-green-900 text-lg">
                ¡Tokens enviados exitosamente!
              </p>
              <p className="text-sm text-green-700 mt-1">{result.message}</p>
            </div>
          </div>
          
          {(result.usdc_amount_sent || result.eth_amount_sent) && (
            <div className="bg-white rounded-lg p-4 space-y-2 border border-green-200">
              {result.usdc_amount_sent && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">💵 USDC recibidos:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {Number(result.usdc_amount_sent).toLocaleString()} USDC
                  </span>
                </div>
              )}
              
              {result.eth_amount_sent && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">⛽ ETH para gas:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {result.eth_amount_sent} ETH
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Explorer Links */}
          <div className="space-y-2">
            {result.explorer_usdc_url && (
              <a
                href={result.explorer_usdc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-3 px-4 bg-green-600 hover:bg-green-700 
                           text-white rounded-lg transition-colors font-medium text-sm"
              >
                Ver transacción USDC en Explorer ↗
              </a>
            )}
            
            {result.explorer_eth_url && (
              <a
                href={result.explorer_eth_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-3 px-4 bg-green-600 hover:bg-green-700 
                           text-white rounded-lg transition-colors font-medium text-sm"
              >
                Ver transacción ETH en Explorer ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-700" />
          <h4 className="font-semibold text-blue-900">Información del Faucet</h4>
        </div>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="text-blue-600">⏱️</span>
            <span>Límite: 1 solicitud cada 24 horas por wallet</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-600">💰</span>
            <span>Recibirás: 10,000 USDC + 0.001 ETH</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-600">🌐</span>
            <span>Red: {config?.name || 'Testnet'}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-600">🎯</span>
            <span>Los tokens son solo para pruebas (sin valor real)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}