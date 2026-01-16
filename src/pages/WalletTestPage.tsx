import React from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { useContractAddresses } from '../hooks/useEthernityDAO';
import { Wallet, Network, Code, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

const WalletTestPage: React.FC = () => {
  const { address, isConnected, chain, connector } = useAccount();
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const { addresses, isConfigured } = useContractAddresses();
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatBalance = (bal: any) => bal ? parseFloat(bal.formatted).toFixed(4) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🔧 Centro de Pruebas de Wallet
          </h1>
          <p className="text-gray-600 text-lg">
            Interfaz completa para testing de conectividad y contratos
          </p>
          {process.env.NODE_ENV === 'production' && (
            <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              ⚠️ Esta página es solo para desarrollo
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN - WALLET */}
          <div className="space-y-6">
            {/* Connection Status Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-forest-green to-dark-blue p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="text-white" size={24} />
                    <h2 className="text-xl font-bold text-white">Estado de Wallet</h2>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-xs font-bold ${
                    isConnected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {isConnected ? '🟢 Conectada' : '🔴 Desconectada'}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!isConnected ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm mb-4">
                      Selecciona un proveedor de wallet para conectar:
                    </p>
                    {connectors.map((conn) => (
                      <button
                        key={conn.id}
                        onClick={() => connect({ connector: conn })}
                        disabled={isPending}
                        className="w-full px-6 py-4 bg-gradient-to-r from-forest-green to-dark-blue text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-between group"
                      >
                        <span className="text-lg">{conn.name}</span>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    ))}
                    {connectError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mt-4">
                        <strong>Error:</strong> {connectError.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Address */}
                    <div>
                      <div className="text-gray-500 text-xs font-semibold mb-2">DIRECCIÓN</div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-gray-900 font-mono text-sm break-all mb-1">
                          {address}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Formato corto: {formatAddress(address!)}
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div>
                      <div className="text-gray-500 text-xs font-semibold mb-2">BALANCE</div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-gray-900 text-2xl font-bold">
                          {balance ? `${formatBalance(balance)} ${balance.symbol}` : 'Cargando...'}
                        </div>
                      </div>
                    </div>

                    {/* Connector */}
                    <div>
                      <div className="text-gray-500 text-xs font-semibold mb-2">CONECTOR</div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-gray-900 font-medium">
                          {connector?.name || 'Desconocido'}
                        </div>
                      </div>
                    </div>

                    {/* Disconnect Button */}
                    <button
                      onClick={() => disconnect()}
                      className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold border-2 border-red-200 hover:bg-red-100 transition"
                    >
                      Desconectar Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Network Card */}
            {isConnected && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                  <div className="flex items-center gap-3">
                    <Network className="text-white" size={24} />
                    <h2 className="text-xl font-bold text-white">Red Blockchain</h2>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Current Network */}
                  <div>
                    <div className="text-gray-500 text-xs font-semibold mb-2">RED ACTUAL</div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-gray-900 font-bold text-lg">
                        {chain?.name || 'Desconocida'}
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        Chain ID: {chainId}
                      </div>
                    </div>
                  </div>

                  {/* Warning if wrong network */}
                  {chain?.id !== sepolia.id && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
                        <div>
                          <div className="text-yellow-900 font-bold mb-1">Red Incorrecta</div>
                          <div className="text-yellow-800 text-sm">
                            Debes cambiar a la red Sepolia para probar los contratos de Ethernity DAO.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => switchChain({ chainId: sepolia.id })}
                        className="w-full px-4 py-2 bg-yellow-200 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-300 transition"
                      >
                        Cambiar a Sepolia
                      </button>
                    </div>
                  )}

                  {/* Available Networks */}
                  <div>
                    <div className="text-gray-500 text-xs font-semibold mb-2">REDES DISPONIBLES</div>
                    <div className="space-y-2">
                      {chains.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => switchChain({ chainId: c.id })}
                          disabled={c.id === chain?.id}
                          className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition ${
                            c.id === chain?.id
                              ? 'bg-gradient-to-r from-forest-green to-dark-blue text-white cursor-default'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {c.name} {c.id === chain?.id && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - CONTRACTS & RESOURCES */}
          <div className="space-y-6">
            {/* Contract Addresses Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Code className="text-white" size={24} />
                    <h2 className="text-xl font-bold text-white">Direcciones de Contratos</h2>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-xs font-bold ${
                    isConfigured
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {isConfigured ? '✓ Configurado' : '⚠ No Configurado'}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {Object.entries(addresses).map(([name, addr]) => (
                  <div key={name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-gray-500 text-xs font-semibold mb-1 uppercase">
                      {name.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-gray-900 font-mono text-xs break-all">
                      {addr || <span className="text-red-500">No configurado</span>}
                    </div>
                  </div>
                ))}

                {!isConfigured && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Configuración Requerida
                    </div>
                    <ol className="text-blue-800 text-sm space-y-1 ml-4">
                      <li>1. Despliega los contratos en Sepolia</li>
                      <li>2. Crea el archivo <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
                      <li>3. Agrega las variables VITE_*_ADDRESS</li>
                      <li>4. Reinicia el servidor de desarrollo</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Resources Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
                <h2 className="text-xl font-bold text-white">🔗 Recursos Útiles</h2>
              </div>

              <div className="p-6 space-y-3">
                <a
                  href="https://sepoliafaucet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-forest-green hover:bg-green-50 transition group"
                >
                  <span className="text-gray-900 font-medium">💧 Sepolia Faucet</span>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-forest-green" />
                </a>

                {address && (
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-forest-green hover:bg-green-50 transition group"
                  >
                    <span className="text-gray-900 font-medium">🔍 Ver en Etherscan</span>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-forest-green" />
                  </a>
                )}

                <a
                  href="https://wagmi.sh/react/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-forest-green hover:bg-green-50 transition group"
                >
                  <span className="text-gray-900 font-medium">📚 Wagmi Docs</span>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-forest-green" />
                </a>
              </div>
            </div>

            {/* Debug JSON */}
            <details className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition font-semibold text-gray-900 flex items-center gap-2">
                <Code size={20} />
                Debug JSON (Click para expandir)
              </summary>
              <div className="px-6 py-4 bg-gray-900">
                <pre className="text-green-400 text-xs overflow-auto max-h-96 font-mono">
                  {JSON.stringify(
                    {
                      wallet: {
                        address,
                        isConnected,
                        chainId,
                        chainName: chain?.name,
                        connector: connector?.name,
                        balance: balance ? `${balance.formatted} ${balance.symbol}` : null,
                      },
                      contracts: addresses,
                      isConfigured,
                      availableChains: chains.map(c => ({ id: c.id, name: c.name })),
                      availableConnectors: connectors.map(c => c.name),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={24} />
            Instrucciones de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Preparar Wallet</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Instala MetaMask u otra wallet Web3</li>
                <li>• Crea o importa una cuenta</li>
                <li>• Consigue Sepolia ETH desde un faucet</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Conectar</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Click en "Conectar Wallet"</li>
                <li>• Selecciona tu proveedor</li>
                <li>• Aprueba la conexión en el popup</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Verificar Red</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Asegúrate de estar en Sepolia</li>
                <li>• Usa el botón "Cambiar a Sepolia"</li>
                <li>• Verifica el Chain ID (11155111)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">4. Verificar Contratos</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Revisa que las addresses estén configuradas</li>
                <li>• Consulta la documentación del deploy</li>
                <li>• Prueba las interacciones desde la app</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTestPage;