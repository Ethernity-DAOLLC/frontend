import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Copy, ExternalLink, ArrowRight, Sparkles, DollarSign, Calendar } from 'lucide-react';

const ContractCreatedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const { 
    txHash, 
    initialDeposit,
    fundAddress,  // ← Agregar dirección del contrato
    monthlyDeposit, // ← Agregar depósito mensual
  } = location.state || {};

  useEffect(() => {
    if (!txHash) {
      navigate('/dashboard', { replace: true });
    }
  }, [txHash, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (num: string | number) =>
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 2 
    }).format(Number(num));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-4 border-emerald-300 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-12 text-center text-white">
            <CheckCircle className="w-32 h-32 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl sm:text-5xl font-black mb-4">
              Contract Created Successfully! 🎉
            </h1>
            <p className="text-lg sm:text-xl opacity-90">
              Your retirement fund is now on the blockchain
            </p>
          </div>

          {/* Details */}
          <div className="p-8 sm:p-12 space-y-8">
            {/* Fund Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-emerald-600" size={20} />
                  <p className="text-gray-600 font-semibold">Initial Deposit</p>
                </div>
                <p className="text-4xl font-black text-emerald-700">
                  {formatCurrency(initialDeposit || 0)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  97% returned to you for DeFi investment
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-blue-600" size={20} />
                  <p className="text-gray-600 font-semibold">Monthly Deposit</p>
                </div>
                <p className="text-4xl font-black text-blue-700">
                  {formatCurrency(monthlyDeposit || 0)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Required to meet your retirement goal
                </p>
              </div>
            </div>

            {/* Contract Address */}
            {fundAddress && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <p className="text-gray-700 font-bold text-lg mb-3">Your Fund Contract Address</p>
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-purple-300">
                  <code className="flex-1 text-sm font-mono text-purple-800 break-all">
                    {fundAddress}
                  </code>
                  <button
                    onClick={() => copyToClipboard(fundAddress)}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition flex-shrink-0"
                    title="Copy contract address"
                  >
                    <Copy size={20} />
                  </button>
                  <a
                    href={`https://sepolia.arbiscan.io/address/${fundAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition flex-shrink-0"
                    title="View contract on Arbiscan"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            <div className="space-y-4">
              <p className="text-gray-700 font-bold text-lg">Transaction Hash</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                  {txHash}
                </code>
                <button
                  onClick={() => copyToClipboard(txHash)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition flex-shrink-0"
                  title="Copy transaction hash"
                >
                  <Copy size={20} />
                </button>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition flex-shrink-0"
                  title="View on Arbiscan"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
              {copied && (
                <p className="text-green-600 font-semibold text-center animate-pulse">
                  ✅ Copied to clipboard
                </p>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Sparkles className="text-purple-600" />
                Next Steps
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3 text-base sm:text-lg">
                  <span className="text-emerald-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Go to Dashboard</strong> to view your fund details and balance
                  </div>
                </li>
                <li className="flex items-start gap-3 text-base sm:text-lg">
                  <span className="text-emerald-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Make monthly deposits</strong> of {formatCurrency(monthlyDeposit || 0)} to stay on track
                  </div>
                </li>
                <li className="flex items-start gap-3 text-base sm:text-lg">
                  <span className="text-emerald-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Monitor your progress</strong> and adjust your plan as needed
                  </div>
                </li>
                <li className="flex items-start gap-3 text-base sm:text-lg">
                  <span className="text-emerald-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Invest your funds</strong> in approved DeFi protocols to earn returns
                  </div>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xl sm:text-2xl py-6 sm:py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
            >
              Go to Dashboard
              <ArrowRight size={32} />
            </button>

            {/* Info Footer */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-800">
                💡 <strong>Remember:</strong> This is on Arbitrum Sepolia testnet. 
                These are test tokens with no real value.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCreatedPage;
