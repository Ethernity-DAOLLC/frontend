import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
}

interface HeaderProps {
  wallet: WalletState;
}

const Header: React.FC<HeaderProps> = ({ wallet }) => {
  const [notificationCount] = React.useState(3);
  const formatAddress = (addr: string | null): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">Manage platform contracts and users</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <Bell size={24} className="text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Network Status */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            wallet.isCorrectNetwork 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {wallet.isCorrectNetwork ? '🟢 Connected' : '🔴 Wrong Network'}
          </div>

          {/* Admin Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">Admin</p>
              <p className="text-xs text-gray-500 font-mono">
                {formatAddress(wallet.address)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;