import React, { useState } from 'react';
import { useEthernityDAO } from '@/hooks';
import { formatUSDC as formatUSDCUtil } from '@/hooks/usdc';
import { useAccount } from 'wagmi';
import { format } from 'date-fns';
import { 
  Wallet, Shield, TrendingUp, DollarSign, Calendar, Clock, 
  CheckCircle, AlertCircle, ArrowRight, RefreshCw, Sparkles,
  Target, MessageCircle, ExternalLink, PieChart, Award
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { address } = useAccount();
  const { 
    personalFund, 
    factory, 
    treasury, 
    token, 
    isLoading, 
    refetchAll 
  } = useEthernityDAO();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const hasFund = !!factory.userFund && factory.userFund !== '0x0000000000000000000000000000000000000000';
  const fundAddress = factory.userFund;
  const formatTimestamp = (ts: bigint | undefined) => {
    if (!ts || ts === BigInt(0)) return 'Never';
    const date = new Date(Number(ts) * 1000);
    return format(date, "MMM dd, yyyy - HH:mm");
  };

  const formatUSDC = (amount: bigint | undefined) => {
    if (!amount) return '$0';
    return `$${formatUSDCUtil(amount)}`;
  };

  const handleMonthlyDeposit = async () => {
    console.log('Making monthly deposit...');
    setIsDepositModalOpen(false);
  };

  const handleCustomDeposit = async () => {
    console.log('Making custom deposit:', depositAmount);
    setIsDepositModalOpen(false);
  };

  const handleStartRetirement = async () => {
    console.log('Starting retirement...');
  };

  const calculateProgress = () => {
    if (!personalFund.fundInfo) return null;
    
    const currentBalance = Number(personalFund.balance || 0n) / 1e6;
    const monthlyDeposit = Number(personalFund.fundInfo.monthlyDeposit || 0n) / 1e6;
    const desiredMonthly = Number(personalFund.fundInfo.desiredMonthly || 0n) / 1e6;
    const retirementAge = Number(personalFund.fundInfo.retirementAge || 0);
    const currentAge = Number(personalFund.fundInfo.currentAge || 0);
    const monthsToRetirement = (retirementAge - currentAge) * 12;
    const projectedBalance = currentBalance + (monthlyDeposit * monthsToRetirement);
    const neededBalance = desiredMonthly * 12 * 25;
    const progressPercentage = Math.min((projectedBalance / neededBalance) * 100, 100);
    
    return {
      currentBalance,
      projectedBalance,
      neededBalance,
      progressPercentage,
      onTrack: projectedBalance >= neededBalance,
      monthsToRetirement
    };
  };

  const progress = calculateProgress();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-6 text-indigo-600" size={64} />
          <p className="text-2xl font-bold text-gray-700">Loading your Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-800 mb-4 flex items-center justify-center gap-4">
            <Sparkles className="text-purple-600" size={48} />
            Your Ethernity Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Welcome, <strong className="text-indigo-600">{address?.slice(0, 8)}...{address?.slice(-6)}</strong>
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            Manage your financial future on blockchain
          </p>
          <button
            onClick={refetchAll}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={20} />
            Refresh All Data
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Fund Section */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Personal Fund Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                <h2 className="text-3xl sm:text-4xl font-black text-gray-800 flex items-center gap-3 sm:gap-4">
                  <Shield className="text-emerald-600" size={40} />
                  My Personal Fund
                </h2>
                {hasFund ? (
                  <span className="bg-green-100 text-green-800 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base whitespace-nowrap">
                    <CheckCircle size={18} className="inline mr-2" />
                    Active
                  </span>
                ) : (
                  <span className="bg-orange-100 text-orange-800 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base whitespace-nowrap">
                    <AlertCircle size={18} className="inline mr-2" />
                    No Fund
                  </span>
                )}
              </div>

              {hasFund ? (
                <div className="space-y-6 sm:space-y-8">
                  {/* Balance & Status */}
                  <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <p className="text-gray-600 text-base sm:text-lg mb-2">Current Balance</p>
                      <p className="text-4xl sm:text-5xl font-black text-emerald-600">
                        {formatUSDC(personalFund.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base sm:text-lg mb-2">Fund Status</p>
                      <p className="text-2xl sm:text-3xl font-bold text-indigo-700">
                        {personalFund.fundInfo?.retirementStarted ? 'Retired' : 'Saving'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progress && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <Target size={20} className="text-blue-600" />
                          Progress to Goal
                        </h3>
                        <span className={`font-black text-lg ${progress.onTrack ? 'text-green-600' : 'text-orange-600'}`}>
                          {progress.progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div 
                          className={`h-4 rounded-full transition-all ${progress.onTrack ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Projected at Retirement</p>
                          <p className="font-bold text-gray-800">${progress.projectedBalance.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Goal Amount</p>
                          <p className="font-bold text-gray-800">${progress.neededBalance.toFixed(0)}</p>
                        </div>
                      </div>
                      {!progress.onTrack && (
                        <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3">
                          <p className="text-sm text-orange-800">
                            ⚠️ You may need to increase your monthly deposits to reach your retirement goal
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fund Details */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-600 text-sm mb-1">Monthly Deposit</p>
                      <p className="text-xl font-bold text-gray-800">
                        {formatUSDC(personalFund.fundInfo?.monthlyDeposit)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-600 text-sm mb-1">Total Deposits</p>
                      <p className="text-xl font-bold text-gray-800">
                        {personalFund.depositStats?.monthlyDepositCount || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-600 text-sm mb-1">Retirement Age</p>
                      <p className="text-xl font-bold text-gray-800">
                        {personalFund.fundInfo?.retirementAge || 0} years
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-600 text-sm mb-1">Desired Monthly</p>
                      <p className="text-xl font-bold text-gray-800">
                        {formatUSDC(personalFund.fundInfo?.desiredMonthly)}
                      </p>
                    </div>
                  </div>

                  {/* Contract Address */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 border-2 border-indigo-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 font-medium mb-2">Fund Contract Address</p>
                        <p className="font-mono text-xs sm:text-sm break-all text-indigo-800">
                          {fundAddress}
                        </p>
                      </div>
                      <a
                        href={`https://sepolia.arbiscan.io/address/${fundAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition flex-shrink-0"
                        title="View on Arbiscan"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </div>

                  {/* Timelock Info */}
                  {personalFund.timelockInfo?.timelockEnd && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300">
                      <p className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                        <Clock size={24} className="text-amber-600" />
                        Timelock ends:
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-amber-700">
                        {formatTimestamp(personalFund.timelockInfo.timelockEnd)}
                      </p>
                      {personalFund.timelockInfo.remaining && personalFund.timelockInfo.remaining > 0n && (
                        <p className="text-sm text-amber-600 mt-2">
                          {Math.floor(Number(personalFund.timelockInfo.remaining) / 86400)} days remaining
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsDepositModalOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <DollarSign size={24} />
                      Make Monthly Deposit
                    </button>
                    {!personalFund.fundInfo?.retirementStarted && personalFund.timelockInfo?.isUnlocked && (
                      <button 
                        onClick={handleStartRetirement}
                        className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <TrendingUp size={24} />
                        Start Retirement
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <Wallet className="w-24 h-24 sm:w-32 sm:h-32 text-gray-300 mx-auto mb-6" />
                  <p className="text-xl sm:text-2xl text-gray-600 mb-8">You don't have a retirement fund yet</p>
                  <button
                    onClick={() => window.location.href = '/calculator'}
                    className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-lg sm:text-xl py-5 px-10 rounded-2xl shadow-2xl transition transform hover:scale-105 inline-flex items-center gap-3"
                  >
                    <Sparkles size={28} />
                    Create My Fund Now
                    <ArrowRight size={28} />
                  </button>
                </div>
              )}
            </div>

            {/* DeFi Investment Card (Placeholder) */}
            {hasFund && (
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-10">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                  <PieChart className="text-blue-600" size={32} />
                  DeFi Investments
                </h3>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                  <p className="text-gray-600 mb-4">
                    Your funds can be invested in approved DeFi protocols to earn returns
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition">
                    View Investment Opportunities
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sm:space-y-8">
            {/* Global Treasury */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <DollarSign className="text-purple-600" size={36} />
                Global Treasury
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600 text-sm sm:text-base">Total in Treasury</p>
                  <p className="text-3xl sm:text-4xl font-black text-purple-700">
                    {treasury.totalDeposited ? formatUSDC(treasury.totalDeposited) : '$0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm sm:text-base">Funds Created</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
                    {treasury.fundCount || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <Award className="text-indigo-600" size={36} />
                Governance
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600 text-sm sm:text-base">Token Holders</p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-600">
                    {token.holderCount || 0}
                  </p>
                </div>
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 sm:py-4 rounded-xl transition transform hover:scale-105">
                  View Proposals
                </button>
              </div>
            </div>

            {/* Support / Contact DAO */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl shadow-2xl border-2 border-pink-200 p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 mb-4 flex items-center gap-3">
                <MessageCircle className="text-pink-600" size={28} />
                Need Help?
              </h3>
              <p className="text-gray-700 text-sm sm:text-base mb-6">
                Contact the DAO community for questions about your retirement plan or investment strategies
              </p>
              <div className="space-y-3">
                <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition">
                  Contact DAO
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition">
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Make a Deposit</h3>
            <div className="space-y-4">
              <button
                onClick={handleMonthlyDeposit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition"
              >
                Deposit Monthly Amount ({formatUSDC(personalFund.fundInfo?.monthlyDeposit)})
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter custom amount:
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter USDC amount"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleCustomDeposit}
                disabled={!depositAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition"
              >
                Deposit Custom Amount
              </button>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;