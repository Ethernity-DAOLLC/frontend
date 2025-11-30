import React, { useState, useEffect } from 'react';
import {
  FileText, Wallet, Users, Shield, RefreshCw, ExternalLink, User
} from 'lucide-react';
import { useEthernityDAO } from '@/hooks';
import { formatUSDC } from '@/hooks/usdc';
import { useAccount, useReadContracts } from 'wagmi';
import PersonalFundFactoryABI from '@/abis/PersonalFundFactory.json';
import { Address } from 'viem';

const ContractsManagement: React.FC = () => {
  const { address } = useAccount();
  const { factory, treasury, refetchAll, isLoading: daoLoading } = useEthernityDAO();
  const [funds, setFunds] = useState<Array<{ address: Address; owner: Address }>>([]);
  const [loadingFunds, setLoadingFunds] = useState(true);
  const isAdmin = address && factory.admin?.toLowerCase() === address.toLowerCase();
  const factoryContract = {
    address: factory.address as `0x${string}`,
    abi: PersonalFundFactoryABI,
  };

  const { data: factoryData, refetch: refetchFactory } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...factoryContract, functionName: 'totalFundsCreated' },
      { ...factoryContract, functionName: 'getAllFunds' },
    ],
  });

  const totalFunds = factoryData?.[0]?.status === 'success' 
    ? (factoryData[0].result as bigint) 
    : 0n;

  const allFundsArray = factoryData?.[1]?.status === 'success'
    ? (factoryData[1].result as Address[])
    : [];

  const fundsWithOwnersCalls = allFundsArray.map((fundAddr) => ({
    ...factoryContract,
    functionName: 'getFundOwner' as const,
    args: [fundAddr] as const,
  }));

  const { data: ownersData } = useReadContracts({
    allowFailure: true,
    contracts: fundsWithOwnersCalls,
    query: { enabled: allFundsArray.length > 0 },
  });

  useEffect(() => {
    if (!ownersData) {
      if (allFundsArray.length === 0) {
        setFunds([]);
        setLoadingFunds(false);
      }
      return;
    }

    const formatted = allFundsArray.map((addr, i) => ({
      address: addr,
      owner: ownersData[i]?.status === 'success' 
        ? (ownersData[i].result as Address)
        : '0x0000000000000000000000000000000000000000',
    }));

    setFunds(formatted);
    setLoadingFunds(false);
  }, [ownersData, allFundsArray]);

  const handleRefresh = () => {
    refetchAll();
    refetchFactory();
    setLoadingFunds(true);
  };

  if (daoLoading) return <div className="text-center py-20 text-xl">Cargando DAO...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestión de Contratos</h1>
          <button
            onClick={handleRefresh}
            disabled={loadingFunds}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
          >
            <RefreshCw size={20} className={loadingFunds ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <FileText className="text-blue-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Total Fondos</p>
            <p className="text-3xl font-bold text-blue-700">{totalFunds.toString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Wallet className="text-green-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">TVL Total</p>
            <p className="text-3xl font-bold text-green-700">{formatUSDC(treasury.totalDeposited)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Users className="text-purple-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Usuarios Únicos</p>
            <p className="text-3xl font-bold text-purple-700">{funds.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Shield className="text-yellow-600 mb-2" size={32} />
            <p className="text-sm text-gray-600">Tu Rol</p>
            <p className="text-xl font-bold">{isAdmin ? '👑 ADMIN' : '👤 Usuario'}</p>
          </div>
        </div>

        {/* Lista de Fondos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold">Todos los Fondos Personales Creados ({funds.length})</h2>
          </div>

          {loadingFunds ? (
            <div className="p-12 text-center text-gray-500">Cargando fondos...</div>
          ) : funds.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">Aún no se ha creado ningún fondo personal</p>
              <p className="mt-2 text-sm">¡Sé el primero en crear uno!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección Fondo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Explorer</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {funds.map((fund, i) => (
                    <tr key={fund.address} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">
                        {fund.address.slice(0, 10)}...{fund.address.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        {fund.owner.toLowerCase() === address?.toLowerCase() ? (
                          <span className="text-green-600 font-semibold">TÚ</span>
                        ) : (
                          `${fund.owner.slice(0, 8)}...${fund.owner.slice(-6)}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`https://sepolia.arbiscan.io/address/${fund.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          Ver <ExternalLink size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Como admin puedes ajustar límites y timelocks desde Governance (próximamente)
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsManagement;