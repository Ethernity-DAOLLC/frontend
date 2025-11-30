import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Wallet, FileText, Users, TrendingUp, Mail,
  DollarSign, Layers, LogOut, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBalance, useReadContract } from 'wagmi';
import { formatEther } from 'viem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingMessages, setPendingMessages] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const { data: treasuryBalance } = useBalance({
    address: import.meta.env.VITE_TREASURY_ADDRESS as `0x${string}`,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchPendingMessages();
  }, [navigate]);

  const fetchPendingMessages = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/v1/contact/messages?unread_only=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingMessages(data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const stats = [
    { title: 'Treasury Balance', value: treasuryBalance ? `${parseFloat(formatEther(treasuryBalance.value)).toFixed(4)} ETH` : '—', icon: Wallet, color: 'bg-emerald-500', link: '/admin/treasury' },
    { title: 'Fondos Creados', value: '1,248', icon: FileText, color: 'bg-purple-500', link: '/admin/contracts' },
    { title: 'Token Holders', value: '892', icon: Users, color: 'bg-amber-500', link: '/admin/tokens' },
    { title: 'Mensajes Pendientes', value: pendingMessages, icon: Mail, color: pendingMessages > 0 ? 'bg-red-500' : 'bg-gray-500', link: '/admin/contact' },
    { title: 'Propuestas Activas', value: '3', icon: TrendingUp, color: 'bg-indigo-500', link: '/admin/governance' },
    { title: 'TVL Total', value: '4.82M USD', icon: DollarSign, color: 'bg-cyan-500', link: '/admin/treasury' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      {/* Header con Logout */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Treasury Panel</h1>
              <p className="text-purple-100">Ethernity DAO — Fondo de Retiro Blockchain</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition backdrop-blur"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, i) => (
            <Link
              key={i}
              to={stat.link}
              className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all p-8 group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`${stat.color} p-4 rounded-2xl text-white group-hover:scale-110 transition`}>
                  <stat.icon className="w-10 h-10" />
                </div>
                <RefreshCw className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 group-hover:rotate-180 transition" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">{stat.title}</h3>
              <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Gestión Treasury', desc: 'Retiros, fees y balances', icon: Wallet, color: 'bg-emerald-600', link: '/admin/treasury' },
            { title: 'Mensajes de Usuarios', desc: 'Soporte y consultas', icon: Mail, color: 'bg-orange-600', link: '/admin/contact' },
            { title: 'Gobernanza', desc: 'Propuestas y votaciones', icon: Shield, color: 'bg-indigo-600', link: '/admin/governance' },
            { title: 'Contratos', desc: 'Fondos personales creados', icon: FileText, color: 'bg-blue-600', link: '/admin/contracts' },
            { title: 'Token Geras', desc: 'Ciclo mensual y holders', icon: Layers, color: 'bg-purple-600', link: '/admin/tokens' },
            { title: 'Protocolos DeFi', desc: 'Integraciones activas', icon: TrendingUp, color: 'bg-teal-600', link: '/admin/protocols' },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.link}
              className={`${action.color} text-white rounded-2xl p-8 hover:opacity-90 transition group`}
            >
              <action.icon className="w-12 h-12 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-2xl font-bold mb-2">{action.title}</h3>
              <p className="text-white/90">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
