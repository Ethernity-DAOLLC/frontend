import React, { useState, useEffect } from 'react';
import {
  Coins, Flame, RefreshCw, Users, TrendingUp, Calendar,
  AlertCircle, CheckCircle, Clock, Activity, Shield, Search
} from 'lucide-react';
import { useEthernityDAO } from '@/hooks';
import { useAccount, useReadContracts } from 'wagmi';
import { format } from 'date-fns';

const TokenManagement: React.FC = () => {
  const { address } = useAccount();
  const { token, refetchAll, isLoading: daoLoading } = useEthernityDAO();
  const [searchAddress, setSearchAddress] = useState('');
  const [holderData, setHolderData] = useState<any[]>([]);
  const holderCount = Number(token.holderCount || 0);
  const limit = Math.min(holderCount, 50);
  const { data: multicallData, isLoading: multicallLoading } = useReadContracts({
    contracts: Array.from({ length: limit }, (_, i) => ({
      address: token.addresses.token,
      abi: [], 
      functionName: 'holderAtIndex',
      args: [BigInt(i)],
    })).concat(
      Array.from({ length: limit }, (_, i) => [
        {
          address: token.addresses.token,
          abi: [],
          functionName: 'balanceOf',
          args: [], 
        },
        {
          address: token.addresses.token,
          abi: [],
          functionName: 'hasActivityThisMonth',
          args: [],
        },
        {
          address: token.addresses.token,
          abi: [],
          functionName: 'lastActivityTimestamp',
          args: [],
        },
      ]).flat()
    ),
    allowFailure: true,
  });

  useEffect(() => {
    if (!multicallData || multicallLoading) return;

    const holders: any[] = [];
    for (let i = 0; i < limit; i++) {
      const holderAddr = multicallData[i]?.result as `0x${string}`;
      if (!holderAddr || holderAddr === '0x0000000000000000000000000000000000000000') continue;

      const balance = multicallData[limit + i * 3]?.result as bigint;
      const hasActivity = multicallData[limit + i * 3 + 1]?.result as boolean;
      const lastActivity = multicallData[limit + i * 3 + 2]?.result as bigint;

      holders.push({
        address: holderAddr,
        balance: balance || 0n,
        hasActivity: hasActivity || false,
        lastActivity: lastActivity ? Number(lastActivity) * 1000 : 0,
      });
    }

    setHolderData(holders);
  }, [multicallData, multicallLoading, limit]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Nunca';
    return format(new Date(timestamp), 'dd MMM yyyy');
  };

  if (daoLoading || multicallLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600">Cargando datos de holders con Multicall...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Token GERAS – Multicall Dashboard</h1>
          <button onClick={refetchAll} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition">
            <RefreshCw size={20} /> Actualizar Todo
          </button>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <Coins className="text-yellow-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Current Supply</p>
            <p className="text-2xl font-bold">{token.currentSupply?.toString() || '0'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Users className="text-green-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Total Holders</p>
            <p className="text-2xl font-bold">{token.holderCount?.toString() || '0'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Activity className="text-indigo-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Burn Today</p>
            <p className="text-2xl font-bold">{token.canBurnToday ? 'SÍ' : 'NO'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Flame className="text-orange-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Renew Today</p>
            <p className="text-2xl font-bold">{token.canRenewToday ? 'SÍ' : 'NO'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <TrendingUp className="text-purple-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Cargados</p>
            <p className="text-2xl font-bold">{holderData.length}/{holderCount}</p>
          </div>
        </div>

        {/* Tabla de Holders con Multicall */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center gap-4">
              <Search size={24} className="text-gray-500" />
              <input
                type="text"
                placeholder="Buscar holder..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Holder</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actividad Mes</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Última Actividad</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Estado Voto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holderData
                  .filter(h => !searchAddress || h.address.toLowerCase().includes(searchAddress.toLowerCase()))
                  .map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono text-sm">
                        {h.address.slice(0, 8)}...{h.address.slice(-6)}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600">
                        {(Number(h.balance) / 1e18).toFixed(3)} GERAS
                      </td>
                      <td className="px-6 py-4">
                        {h.hasActivity ? 
                          <CheckCircle className="text-green-600" size={24} /> : 
                          <XCircle className="text-red-600" size={24} />
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(h.lastActivity)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          h.hasActivity ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {h.hasActivity ? 'PUEDE VOTAR' : 'SIN VOTO'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {holderData.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Shield size={64} className="mx-auto mb-4 text-gray-300" />
                <p>No hay holders aún o cargando con Multicall...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenManagement;