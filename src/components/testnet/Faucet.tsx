import { useState, useEffect } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBalance 
} from 'wagmi';
import { 
  Droplet, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { formatEther, parseEther } from 'viem';
import { CONTRACTS, CHAIN_CONFIG, hasTestnet } from '../../config/contracts';

export default function Faucet() {
  const { address, isConnected, chain } = useAccount();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showInfo, setShowInfo] = useState(false);

  if (!hasTestnet) {
    return null;
  }

  const FAUCET_ADDRESS = CONTRACTS.faucet!.address;
  const FAUCET_ABI = CONTRACTS.faucet!.abi;
  const TOKEN_ADDRESS = CONTRACTS.testToken!.address;

  const { 
    data: canRequest, 
    refetch: refetchCanRequest,
    isLoading: isLoadingCanRequest 
  } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'can_request',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const { 
    data: timeUntilNext, 
    refetch: refetchTime 
  } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'get_time_until_next_request',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, 
    }
  });

  const { data: faucetBalance, refetch: refetchFaucetBalance } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'get_faucet_balance',
  });

  const { data: amountPerRequest } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'amount_per_request',
  });

  const { data: cooldownTime } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'cooldown_time',
  });

  const { data: userTokenBalance, refetch: refetchUserBalance } = useBalance({
    address: address,
    token: TOKEN_ADDRESS,
  });

  const { data: faucetStats } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'get_stats',
  });

  const { 
    writeContract, 
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess,
    isError: isTxError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (timeUntilNext && Number(timeUntilNext) > 0) {
      setTimeLeft(Number(timeUntilNext));
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            refetchCanRequest();
            refetchTime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [timeUntilNext]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        refetchCanRequest();
        refetchTime();
        refetchFaucetBalance();
        refetchUserBalance();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (writeError || isTxError) {
      const timer = setTimeout(() => {
        resetWrite();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [writeError, isTxError]);

  const handleRequestTokens = () => {
    if (!address || !canRequest) return;

    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: 'request_tokens',
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const isLoading = isWritePending || isConfirming;
  const faucetEmpty = faucetBalance && Number(faucetBalance) === 0;
  const wrongNetwork = chain && chain.id !== CHAIN_CONFIG.chainId;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner de Testnet */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800 mb-1">
              Entorno de Prueba - {CHAIN_CONFIG.network}
            </p>
            <p className="text-yellow-700">
              Estos son tokens de prueba sin valor real. Úsalos para probar la aplicación antes de usar fondos reales.
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
                  Test Token Faucet
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Obtén tokens de prueba gratis
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
              ℹ️ ¿Qué es un Faucet?
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Un faucet es un servicio que distribuye tokens de prueba gratuitamente para que puedas experimentar con la aplicación sin arriesgar dinero real.
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Los tokens no tienen valor monetario real</p>
              <p>• Puedes solicitar tokens una vez cada 24 horas</p>
              <p>• Úsalos para probar depósitos y retiros</p>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Por Solicitud</p>
              <p className="text-xl font-bold text-blue-700">
                {amountPerRequest 
                  ? Number(formatEther(amountPerRequest as bigint)).toLocaleString() 
                  : '...'} TRT
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-gray-600 mb-1">Disponible</p>
              <p className="text-xl font-bold text-green-700">
                {faucetBalance 
                  ? Number(formatEther(faucetBalance as bigint)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : '...'} TRT
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-gray-600 mb-1">Cooldown</p>
              <p className="text-xl font-bold text-purple-700">
                {cooldownTime 
                  ? `${Number(cooldownTime) / 3600}h`
                  : '...'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <p className="text-xs text-gray-600 mb-1">Tu Balance</p>
              <p className="text-xl font-bold text-orange-700">
                {userTokenBalance 
                  ? Number(formatEther(userTokenBalance.value)).toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : '0'} TRT
              </p>
            </div>
          </div>

          {faucetStats && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                📊 Estadísticas del Faucet
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Distribuido</p>
                  <p className="font-bold text-gray-900">
                    {formatEther((faucetStats as any)[0] as bigint)} TRT
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Solicitudes Totales</p>
                  <p className="font-bold text-gray-900">
                    {(faucetStats as any)[1].toString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Red incorrecta */}
          {wrongNetwork && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Red Incorrecta
                </p>
                <p className="text-xs text-red-700">
                  Por favor cambia a {CHAIN_CONFIG.network} en tu wallet
                </p>
              </div>
            </div>
          )}

          {/* Wallet no conectada */}
          {!isConnected ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  Wallet No Conectada
                </p>
                <p className="text-xs text-yellow-700 mb-3">
                  Conecta tu wallet para solicitar tokens de prueba
                </p>
                <button className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                  Conectar Wallet
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleRequestTokens}
                disabled={
                  !canRequest || 
                  isLoading || 
                  faucetEmpty || 
                  wrongNetwork ||
                  isLoadingCanRequest
                }
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {isConfirming ? 'Confirmando Transacción...' : 'Solicitando Tokens...'}
                    </>
                  ) : !canRequest && timeLeft > 0 ? (
                    <>
                      <Clock className="w-6 h-6" />
                      Disponible en {formatTime(timeLeft)}
                    </>
                  ) : faucetEmpty ? (
                    <>
                      <AlertCircle className="w-6 h-6" />
                      Faucet Vacío
                    </>
                  ) : (
                    <>
                      <Droplet className="w-6 h-6" />
                      Solicitar{' '}
                      {amountPerRequest 
                        ? Number(formatEther(amountPerRequest as bigint)).toLocaleString() 
                        : '100'}{' '}
                      TRT
                    </>
                  )}
                </span>
              </button>

              {/* Mensajes de estado */}
              <div className="mt-4 space-y-3">

                {isSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 mb-1">
                        ✅ ¡Tokens Enviados Exitosamente!
                      </p>
                      <p className="text-xs text-green-700 mb-2">
                        Has recibido{' '}
                        {amountPerRequest && formatEther(amountPerRequest as bigint)} TRT.
                        Podrás solicitar más en 24 horas.
                      </p>
                      {hash && (
                        
                          href={`${CHAIN_CONFIG.explorer}/tx/${hash}`}
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

                {/* Error de escritura */}
                {writeError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        Error al Solicitar Tokens
                      </p>
                      <p className="text-xs text-red-700">
                        {writeError.message.includes('Must wait') 
                          ? 'Debes esperar 24 horas entre solicitudes'
                          : writeError.message.includes('Faucet is empty')
                          ? 'El faucet está temporalmente vacío'
                          : writeError.message.includes('User rejected')
                          ? 'Transacción rechazada por el usuario'
                          : 'Ocurrió un error. Por favor intenta de nuevo.'}
                      </p>
                    </div>
                  </div>
                )}

                {isTxError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        Transacción Fallida
                      </p>
                      <p className="text-xs text-red-700">
                        La transacción no pudo completarse. Verifica tu balance de gas.
                      </p>
                    </div>
                  </div>
                )}

                {faucetEmpty && !isSuccess && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800 mb-1">
                        Faucet Temporalmente Vacío
                      </p>
                      <p className="text-xs text-orange-700">
                        El faucet necesita ser recargado. Intenta más tarde o contacta al administrador.
                      </p>
                    </div>
                  </div>
                )}

                {!canRequest && timeLeft > 0 && !isSuccess && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 mb-1">
                        Ya Solicitaste Tokens
                      </p>
                      <p className="text-xs text-blue-700">
                        Podrás hacer una nueva solicitud en {formatTime(timeLeft)}
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
            
              href="https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Arbitrum Bridge (ETH para gas)
            </a>
            
              href="https://faucets.chain.link/arbitrum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Chainlink Faucet (ETH Sepolia)
            </a>
            
              href={`${CHAIN_CONFIG.explorer}/address/${FAUCET_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Ver Contrato del Faucet
            </a>
            
              href={`${CHAIN_CONFIG.explorer}/address/${TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              → Ver Contrato del Token
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}