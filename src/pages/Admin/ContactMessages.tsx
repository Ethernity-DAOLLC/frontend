import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Calendar,
  User,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  wallet_address?: string | null;
  timestamp: string;
  is_read: boolean;
  ip_address?: string | null;
}

export default function ContactMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const limit = 10;

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchMessages();
  }, [navigate, page, filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unread_only: filter === 'unread' ? 'true' : 'false',
      });

      const res = await fetch(`${API_URL}/api/v1/contact/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
        return;
      }

      if (!res.ok) throw new Error('Error al cargar mensajes');

      const data = await res.json();
      setMessages(data);
      setTotal(data.length > 0 ? 100 : 0);
    } catch (err) {
      setError('No se pudieron cargar los mensajes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      setMarkingId(id);
      const token = localStorage.getItem('admin_token');

      await fetch(`${API_URL}/api/v1/contact/messages/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, is_read: true } : m))
      );
    } catch (err) {
      setError('Error al marcar como leído');
    } finally {
      setMarkingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-4">
                <Mail className="w-12 h-12" />
                Mensajes de Contacto
              </h1>
              <p className="text-purple-100 text-lg mt-2">
                Administra las consultas de los usuarios del Fondo de Retiro
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{total}</p>
              <p className="text-purple-200">mensajes totales</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                  filter === 'unread'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                No leídos
              </button>
            </div>
            <button
              onClick={fetchMessages}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-5 mb-6">
            <p className="text-red-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              {error}
            </p>
          </div>
        )}

        {/* Lista de mensajes */}
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No hay mensajes {filter === 'unread' && 'sin leer'}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  !msg.is_read ? 'ring-2 ring-orange-400' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {!msg.is_read && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                            NUEVO
                          </span>
                        )}
                        <h3 className="text-xl font-bold text-gray-800">{msg.subject || '(Sin asunto)'}</h3>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{msg.name}</span>
                          <span className="text-gray-500">· {msg.email}</span>
                        </p>

                        {msg.wallet_address && (
                          <p className="flex items-center gap-2 text-gray-600 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg">
                            <Wallet className="w-4 h-4" />
                            {msg.wallet_address}
                          </p>
                        )}

                        <p className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(msg.timestamp)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => markAsRead(msg.id)}
                      disabled={msg.is_read || markingId === msg.id}
                      className={`px-5 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                        msg.is_read
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {msg.is_read ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Leído
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          Marcar como leído
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-5 mt-4">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación simple */}
        {total > limit && (
          <div className="flex justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg flex items-center gap-2"
            >
              <ChevronLeft /> Anterior
            </button>
            <span className="px-5 py-3 bg-indigo-600 text-white rounded-lg">
              Página {page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
            >
              Siguiente <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
