import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Calculator, FileText, Home, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConnectKitButton } from 'connectkit';

const Navbar: React.FC = () => {
  const { isConnected, address, disconnect } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">Ethernity</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
              <Home size={18} />
              Home
            </Link>
            <Link to="/calculator" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
              <Calculator size={18} />
              Calculator
            </Link>

            {isConnected && (
              <>
                <Link to="/create-contract" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
                  <FileText size={18} />
                  Create Contract
                </Link>
                <Link to="/dashboard" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
                  <TrendingUp size={18} />
                  Dashboard
                </Link>
                <Link to="/contract" className="text-gray-700 hover:text-green-600 font-medium flex items-center gap-1">
                  <FileText size={18} />
                  My Contract
                </Link>
              </>
            )}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <ConnectKitButton />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isConnected && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/create-contract" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium">
              Create Contract
            </Link>
            <Link to="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/contract" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium">
              My Contract
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;