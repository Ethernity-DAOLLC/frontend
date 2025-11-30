import React, { useState } from 'react';
import {
  Shield, Vote, Clock, Play, Trash2, Settings, TrendingUp, Calendar, RefreshCw
} from 'lucide-react';
import { useEthernityDAO } from '@/hooks';
import { formatUSDC } from '@/hooks/usdc';
import { useAccount } from 'wagmi';

const GovernanceManagement: React.FC = () => {
  const { address } = useAccount();
  const { governance, token, refetchAll, isLoading } = useEthernityDAO();

  const isAdmin = governance.admin === address;

  if (isLoading) return <div className="text-center py-20">Cargando Gobernanza...</div>;

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    return `${days.toFixed(0)} días`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gobernanza DAO</h1>
          <button onClick={refetchAll} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2">
            <RefreshCw size={20} /> Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <Vote className="text-indigo-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Propuestas Totales</p>
            <p className="text-3xl font-bold">{governance.proposalCount?.toString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <TrendingUp className="text-green-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Quorum</p>
            <p className="text-3xl font-bold">{governance.quorumPercentage?.toString()}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Clock className="text-purple-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Período de Votación</p>
            <p className="text-2xl font-bold">{formatDuration(governance.votingPeriod || 0n)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Shield className="text-yellow-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Tu Rol</p>
            <p className="text-2xl font-bold">{isAdmin ? 'ADMIN 👑' : 'Miembro'}</p>
          </div>
        </div>

        {/* Propuestas Activas */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Propuestas Activas</h2>
          {governance.activeProposals?.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No hay propuestas activas en este momento</p>
          ) : (
            <div className="space-y-6">
              {/* Aquí se  governance.activeProposals */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">Lista completa en desarrollo (próximamente con paginación)</p>
              </div>
            </div>
          )}
        </div>

        {/* Parámetros (solo admin) */}
        {isAdmin && (
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-yellow-900 mb-4">Panel de Administración</h2>
            <p className="text-yellow-800">Aquí irán los controles para cambiar quorum, período de voto, etc.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceManagement;