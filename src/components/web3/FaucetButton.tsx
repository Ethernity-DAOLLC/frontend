'use client';

import { useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arbitrumSepolia } from 'viem/chains';
import { useFaucet } from '@/hooks/useFaucet';
import { FaucetResponse } from '@/lib/faucet-client';
import { Loader2, Droplets, CheckCircle, AlertCircle } from 'lucide-react';

interface FaucetButtonProps {
  currentAge?: number;
  retirementAge?: number;
  desiredMonthlyPayment?: number;
  monthlyDeposit?: number;
  initialAmount?: number;
  className?: string;
}

const REQUIRED_CHAIN_ID = arbitrumSepolia.id;

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
  const { switchChain } = useSwitchChain();
  const { requestTokens, loading, error } = useFaucet();
  const [result, setResult] = useState<FaucetResponse | null>(null);
  const isCorrectChain = chainId === REQUIRED_CHAIN_ID;
  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (err) {
      console.error('Error switching chain:', err);
    }
  };

  const handleRequest = async () => {
    if (!address || !isConnected) return;

    try {
      const response = await requestTokens({
        wallet_address: address,
        current_age: currentAge,
        retirement_age: retirementAge,
        desired_monthly_payment: desiredMonthlyPayment,
        monthly_deposit: monthlyDeposit,
        initial_amount: initialAmount,
      });

      setResult(response);
      setTimeout(() => setResult(null), 15000);
    } catch (err) {
      console.error('Faucet error:', err);
    }
  };
  if (!isConnected) {
    return (
      <div className={`text-center p-6 bg-amber-50 border border-amber-200 rounded-xl ${className}`}>
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <p className="text-amber-900 font-semibold mb-2">Wallet no conectada</p>
        <p className="text-sm text-amber-700">
          Conecta tu wallet usando el botón superior para continuar
        </p>
      </div>
    );
  }
  if (!isCorrectChain) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
          <p className="text-orange-900 font-semibold text-center mb-2">
            Red incorrecta
          </p>
          <p className="text-sm text-orange-700 text-center mb-4">
            Debes cambiar a Arbitrum Sepolia para solicitar tokens
          </p>
          <button
            onClick={handleSwitchChain}
            className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 
                       text-white rounded-lg font-semibold transition-colors"
          >
            Cambiar a Arbitrum Sepolia
          </button>
        </div>
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Error al solicitar tokens</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {result && result.success && (
        <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 text-lg">
                ¡Tokens enviados exitosamente!
              </p>
              <p className="text-sm text-green-700 mt-1">{result.message}</p>
            </div>
          </div>
          
          {/* Amounts */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            {result.usdc_amount_sent && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">💵 USDC recibidos:</span>
                <span className="font-mono font-bold text-gray-900">
                  {Number(result.usdc_amount_sent).toLocaleString()} USDC
                </span>
              </div>
            )}
            
            {result.eth_amount_sent && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">⛽ ETH para gas:</span>
                <span className="font-mono font-bold text-gray-900">
                  {result.eth_amount_sent} ETH
                </span>
              </div>
            )}
          </div>

          {/* Explorer Links */}
          <div className="space-y-2">
            {result.usdc_transaction_hash && result.explorer_usdc_url && (
              <a
                href={result.explorer_usdc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-3 px-4 bg-green-600 hover:bg-green-700 
                           text-white rounded-lg transition-colors font-medium"
              >
                Ver transacción USDC en Arbiscan ↗
              </a>
            )}
            
            {result.eth_transaction_hash && result.explorer_eth_url && (
              <a
                href={result.explorer_eth_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-3 px-4 bg-green-600 hover:bg-green-700 
                           text-white rounded-lg transition-colors font-medium"
              >
                Ver transacción ETH en Arbiscan ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>⏱️ Límite: 1 solicitud cada 24 horas por wallet</li>
          <li>💰 Recibirás: 10,000 USDC + 0.001 ETH</li>
          <li>🌐 Red: Arbitrum Sepolia (testnet)</li>
          <li>🎯 Los tokens son solo para pruebas</li>
        </ul>
      </div>
    </div>
  );
}