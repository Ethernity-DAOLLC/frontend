import React, { useState } from 'react';
import {
  Wallet, DollarSign, TrendingUp, Users, Settings, Send,
  AlertCircle, CheckCircle, RefreshCw, Shield
} from 'lucide-react';
import { useEthernityDAO } from '@/hooks';
import { formatUSDC } from '@/hooks/usdc';
import { useAccount } from 'wagmi';

const TreasuryManagement: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { treasury, token, usdc, isLoading, refetchAll } = useEthernityDAO();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const isAdmin = treasury.admin === address;
  const isManager = treasury.isTreasuryManager;
  const { execute: withdrawFees, isPending, isConfirming, isSuccess } = useContractWriteWithUSDC({
    contractAddress: treasury.addresses.treasury,
    abi: [],
    functionName: 'withdrawFees',
    args: [recipient, usdc.parseUSDC(withdrawAmount)],
    usdcAmount: withdrawAmount,
    enabled: isAdmin || isManager,
  });

  if (!isConnected || isLoading) {
    return <div className="text-center py-20">Cargando Treasury...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Treasury Management</h1>
          <button onClick={refetchAll} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2">
            <RefreshCw size={20} /> Actualizar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <DollarSign className="text-green-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Total Depositado</p>
            <p className="text-3xl font-bold text-green-700">
              {formatUSDC(treasury.totalDeposited)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <TrendingUp className="text-purple-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Fees Recaudados</p>
            <p className="text-3xl font-bold text-purple-700">
              {formatUSDC(treasury.totalFeesCollected)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Users className="text-blue-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Fondos Activos</p>
            <p className="text-3xl font-bold text-blue-700">{treasury.fundCount || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Shield className="text-indigo-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Tu Rol</p>
            <p className="text-2xl font-bold">{isAdmin ? 'ADMIN 👑' : isManager ? 'Manager ✅' : 'Viewer 👁️'}</p>
          </div>
        </div>

        {/* Withdraw Fees */}
        {(isAdmin || isManager) && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Retirar Fees Recaudados</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="px-4 py-3 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Cantidad en USDC"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="px-4 py-3 border rounded-lg"
              />
            </div>
            <button
              onClick={() => withdrawFees()}
              disabled={!withdrawAmount || !recipient || isPending || isConfirming}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition flex items-center justify-center gap-3"
            >
              <Send size={28} />
              {isPending || isConfirming ? 'Procesando...' : 'Retirar Fees'}
            </button>
            {isSuccess && <p className="text-green-600 text-center mt-4">¡Retiro exitoso!</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasuryManagement;
