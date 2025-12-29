import { useEffect, useState } from 'react';
import { contactAPI, type ContactMessage } from '@/lib/supabase';
import { formatTimestamp } from '@/lib/formatters';
import { Mail, Eye, Trash2, RefreshCw } from 'lucide-react';

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await contactAPI.getAll(filter === 'unread');
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await contactAPI.markAsRead(id);
      fetchMessages();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await contactAPI.delete(id);
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Contact Messages</h1>
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'unread' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Unread Only
          </button>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No messages found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl p-6 shadow ${
                  !msg.read ? 'border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{msg.subject}</h3>
                    <p className="text-sm text-gray-600">
                      From: <strong>{msg.name}</strong> ({msg.email})
                    </p>
                    {msg.wallet_address && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Wallet: {msg.wallet_address}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!msg.read && (
                      <button
                        onClick={() => handleMarkAsRead(msg.id!)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Mark as read"
                      >
                        <Eye size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(msg.id!)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{msg.message}</p>
                <p className="text-xs text-gray-500">
                  {formatTimestamp(msg.created_at || '', { includeTime: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
