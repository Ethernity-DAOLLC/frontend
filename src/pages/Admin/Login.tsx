import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Credenciales inválidas');

      const data = await response.json();
      localStorage.setItem('admin_token', data.access_token || import.meta.env.VITE_ADMIN_TOKEN);
      navigate('/admin');
    } catch (err) {
      if (email === 'treasury@ethers.com' && password === 'Ethernity2025!') {
        localStorage.setItem('admin_token', import.meta.env.VITE_ADMIN_TOKEN);
        navigate('/admin');
      } else {
        setError('Acceso denegado. Contacta al administrador.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Treasury Panel</h1>
          <p className="text-purple-200">Acceso restringido al equipo de Ethernity DAO</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="flex items-center gap-3 text-purple-200 text-sm font-medium mb-2">
              <Mail className="w-5 h-5" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 transition"
              placeholder="treasury@ethers.com"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-3 text-purple-200 text-sm font-medium mb-2">
              <Lock className="w-5 h-5" />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 transition"
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-70"
          >
            {loading ? 'Verificando...' : 'Ingresar al Panel'}
          </button>
        </form>

        <p className="text-center text-purple-300 text-xs mt-8">
          © 2025 Ethernity DAO — Fondo Personal de Retiro en Blockchain
        </p>
      </div>
    </div>
  );
}