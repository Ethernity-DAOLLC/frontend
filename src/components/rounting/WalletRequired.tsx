import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const WalletRequired: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border-4 border-yellow-300">
          <Wallet className="w-32 h-32 text-yellow-600 mx-auto mb-6 animate-pulse" />
          
          <h2 className="text-4xl font-black text-gray-800 mb-4">
            🔐 Wallet Connection Required
          </h2>
          
          <p className="text-xl text-gray-600 mb-8">
            Please connect your wallet to access this page.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-5 px-8 rounded-2xl text-xl transition shadow-lg"
            >
              Go to Home and Connect
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 px-8 rounded-2xl transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletRequired;