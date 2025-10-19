import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import {
  getMessages,
  createMessage,
  deleteMessage,
  subscribeToMessages,
  unsubscribeFromMessages
} from '../services/chatService';

const Chat = () => {
  const { currentUser, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll automático al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar mensajes iniciales
  useEffect(() => {
    loadMessages();
  }, []);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const channel = subscribeToMessages(async (payload) => {
      if (payload.eventType === 'INSERT') {
        // Obtener el mensaje completo con los datos del usuario
        const { data } = await getMessages();
        if (data) {
          setMessages(data);
          scrollToBottom();
        }
      } else if (payload.eventType === 'DELETE') {
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribeFromMessages(channel);
    };
  }, []);

  // Scroll al cargar mensajes o agregar nuevos
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await getMessages();
    if (error) {
      setError(error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);
    const { data, error } = await createMessage(newMessage.trim(), currentUser.id);

    if (error) {
      setError(error);
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      return;
    }

    const { error } = await deleteMessage(messageId);
    if (error) {
      setError(error);
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getUserInitial = (email) => {
    return email?.charAt(0).toUpperCase() || '?';
  };

  return (
    <MainLayout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="users" size="xl" className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                Chat de Equipo
              </h1>
              <p className="text-gray-600 mt-1">Comunicación en tiempo real con todos los trabajadores</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: '500px' }}>
          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <SkeletonLoader key={i} height="80px" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                title="No hay mensajes"
                description="Sé el primero en enviar un mensaje al equipo"
                icon="users"
              />
            ) : (
              messages.map((message) => {
                const isOwn = message.user_id === currentUser?.id;
                const canDelete = isOwn || userRole === 'admin';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                      isOwn
                        ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      {getUserInitial(message.usuario?.email)}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        isOwn
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className={`text-xs font-semibold mb-1 ${isOwn ? 'opacity-90' : 'opacity-75'}`}>
                          {message.usuario?.full_name || message.usuario?.email}
                        </p>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.mensaje}
                        </p>
                      </div>

                      {/* Time and Actions */}
                      <div className={`flex items-center gap-2 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-3">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                disabled={sending}
                className="flex-1"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                variant="primary"
                className="px-6"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="dollarSign" size="sm" />
                    Enviar
                  </span>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Presiona Enter para enviar o Shift + Enter para nueva línea
            </p>
          </form>
        </Card>

        {/* Info Cards - Compactas */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                <Icon name="users" size="md" className="text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="chartBar" size="md" className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Hoy</p>
                <p className="text-xl font-bold text-gray-900">
                  {messages.filter(m => {
                    const today = new Date().toDateString();
                    const msgDate = new Date(m.created_at).toDateString();
                    return today === msgDate;
                  }).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="dollarSign" size="md" className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Estado</p>
                <Badge variant="success" size="sm" className="mt-1">
                  Online
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
