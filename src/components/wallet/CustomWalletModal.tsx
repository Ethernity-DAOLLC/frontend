import { useState } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { X, Wallet } from 'lucide-react';

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomWalletModal: React.FC<CustomWalletModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (connector: any) => {
    try {
      setSelectedConnector(connector.id);
      await connect({ connector });
      onClose();
    } catch (error) {
      console.error('Failed to connect:', error);
      setSelectedConnector(null);
    }
  };

  const getWalletIcon = (connectorId: string) => {
    switch (connectorId) {
      case 'injected':
      case 'metaMask':
        return '🦊';
      case 'walletConnect':
        return '📱';
      case 'coinbaseWallet':
        return '🔷';
      default:
        return '👛';
    }
  };

  const getWalletName = (connector: any) => {
    if (connector.name === 'Injected') {
      if (window.ethereum?.isMetaMask) return 'MetaMask';
      if (window.ethereum?.isRabby) return 'Rabby';
      if (window.ethereum?.isBraveWallet) return 'Brave Wallet';
      return 'Browser Wallet';
    }
    return connector.name;
  };

  const filteredConnectors = connectors.filter(
    (connector) => 
      connector.id !== 'family' && 
      connector.name !== 'Family'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Wallet className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Connect Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Wallet List */}
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {isConnected ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-700 mb-2">Connected</p>
              <p className="text-sm text-gray-500 mb-4">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <button
                onClick={() => {
                  disconnect();
                  onClose();
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <>
              {filteredConnectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending && selectedConnector === connector.id}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-3xl">{getWalletIcon(connector.id)}</span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800">
                      {getWalletName(connector)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {connector.ready ? 'Available' : 'Not installed'}
                    </p>
                  </div>
                  {isPending && selectedConnector === connector.id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  )}
                </button>
              ))}

              {filteredConnectors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No wallets available</p>
                  <p className="text-sm mt-2">Please install a Web3 wallet</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export const useWalletModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
    WalletModal: CustomWalletModal,
  };
};

export default CustomWalletModal;