import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Fondo de Retiro</h1>
      
      {!isConnected ? (
        <button
          onClick={() => connect({ connector: injected() })}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Conectar Wallet
        </button>
      ) : (
        <div>
          <p className="mb-4">Conectado: {address}</p>
          <button
            onClick={() => disconnect()}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Desconectar
          </button>
        </div>
      )}
    </div>
  )
}
