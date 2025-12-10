import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Copy, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';

const ContractCreatedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const { txHash, initialDeposit } = location.state || {};

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

  const formatNumber = (num: string | number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(num));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border-4 border-emerald-300 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-12 text-center text-white">
            <CheckCircle className="w-32 h-32 mx-auto mb-6 animate-bounce" />
            <h1 className="text-5xl font-black mb-4">
              Contract Created Successfully! 🎉
            </h1>
            <p className="text-xl opacity-90">
              Your retirement fund is now on the blockchain
            </p>
          </div>

          {/* Details */}
          <div className="p-12 space-y-8">
            {/* Initial Deposit */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border-2 border-emerald-200">
              <p className="text-gray-600 text-lg mb-2">Initial Deposit</p>
              <p className="text-5xl font-black text-emerald-700">
                ${formatNumber(initialDeposit || 0)}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 font-bold text-lg">Transaction Hash</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                  {txHash}
                </code>
                <button
                  onClick={() => copyToClipboard(txHash)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition"
                  title="Copy"
                >
                  <Copy size={20} />
                </button>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition"
                  title="View on Arbiscan"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
              {copied && (
                <p className="text-green-600 font-semibold text-center">
                  ✅ Copied to clipboard
                </p>
              )}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Sparkles className="text-purple-600" />
                Next Steps
              </h3>
              <ul className="space-y-3 text-gray-700 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Go to Dashboard to view your fund</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Make monthly deposits to fulfill your plan</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Monitor your savings growth</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-2xl py-8 rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-4"
            >
              Go to Dashboard
              <ArrowRight size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCreatedPage;
