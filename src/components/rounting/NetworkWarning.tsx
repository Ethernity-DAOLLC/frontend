import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useChainId } from 'wagmi';

const EXPECTED_CHAIN_ID = 421614;

interface NetworkWarningProps {
  onSwitchNetwork?: () => void;
}

const NetworkWarning: React.FC<NetworkWarningProps> = ({ onSwitchNetwork }) => {
  const chainId = useChainId();
  const isWrongNetwork = chainId !== EXPECTED_CHAIN_ID;

  if (!isWrongNetwork) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
          <div>
            <p className="font-bold text-lg">Wrong Network Detected</p>
            <p className="text-sm opacity-90">
              Please switch to <strong>Arbitrum Sepolia</strong> to use the application
            </p>
          </div>
        </div>
        
        {onSwitchNetwork && (
          <button
            onClick={onSwitchNetwork}
            className="bg-white text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition"
          >
            Switch Network
          </button>
        )}
      </div>
    </div>
  );
};

export default NetworkWarning;
