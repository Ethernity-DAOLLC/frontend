'use client';

import { useConnect, useAccount, useDisconnect, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';

export default function WalletConnectButton() {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isOpen, setIsOpen] = useState(false);

  const expectedChainId = Number(import.meta.env.VITE_CHAIN_ID || 421614);
  const isWrongNetwork = isConnected && chainId !== expectedChainId;

  // Cierra modal al conectar
  useEffect(() => {
    if (isConnected) setIsOpen(false);
  }, [isConnected]);

  if (!isConnected) {
    return (
   <>
     <button
       onClick={() => setIsOpen(true)}
       className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition"
     >
       Connect Wallet
     </button>

     {isOpen && (
       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
         <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
           <h2 className="text-2xl font-bold mb-6 text-center">Connect Wallet</h2>
           {connectors.map((connector) => (
             <button
               key={connector.id}
               onClick={() => connect({ connector })}
               disabled={!connector.ready || isPending}
               className="w-full py-4 mb-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium disabled:opacity-50"
             >
               {connector.ready ? connector.name : `${connector.name} (not installed)`}
             </button>
           ))}
           {error && <p className="text-red-500 text-sm text-center mt-4">{error.message}</p>}
         </div>
       </div>
     )}
   </>
 );
  }

  return (
    <div className="flex items-center gap-3">
      {isWrongNetwork && (
        <span className="text-red-500 text-sm">Wrong network</span>
      )}
      <button
        onClick={() => disconnect()}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Disconnect
      </button>
      <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-lg">
        {address?.slice(0,6)}...{address?.slice(-4)}
      </span>
    </div>
  );
}