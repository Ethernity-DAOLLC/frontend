import React from 'react';
import { LayoutDashboard, FileText, Settings, Home, Shield } from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'contracts' | 'settings';
  onTabChange: (tab: 'overview' | 'contracts' | 'settings') => void;
}

interface NavItem {
  id: 'overview' | 'contracts' | 'settings';
  label: string;
  icon: React.ReactNode;
  description: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard size={20} />,
      description: 'Platform statistics'
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: <FileText size={20} />,
      description: 'User contracts list'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      description: 'Platform configuration'
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-xl z-50">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ethernity</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className={activeTab === item.id ? 'text-white' : 'text-gray-400'}>
              {item.icon}
            </span>
            <div className="text-left">
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs opacity-75">{item.description}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-gray-700 mx-4 my-4"></div>

      {/* Secondary Actions */}
      <div className="p-4">
        <a
          href="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
        >
          <Home size={20} />
          <span className="font-semibold">Back to Home</span>
        </a>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          v1.0.0 • {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;