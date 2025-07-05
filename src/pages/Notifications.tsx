import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read_at?: string;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning': return AlertTriangle;
    case 'error': return XCircle;
    case 'success': return CheckCircle;
    default: return Info;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error': return 'bg-red-100 text-red-800 border-red-200';
    case 'success': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const response = await fetch(`http://localhost:3001/api/notifications${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        toast.error('Erro ao carregar notificações');
      }
    } catch (error) {
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ));
      }
    } catch (error) {
      toast.error('Erro ao marcar como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Todas as notificações foram marcadas como lidas');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success('Notificação deletada');
      }
    } catch (error) {
      toast.error('Erro ao deletar notificação');
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600">{unreadCount} notificação(ões) não lida(s)</p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Não lidas
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            const colorClasses = getNotificationColor(notification.type);
            const isUnread = !notification.read_at;
            
            return (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {isUnread && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Deletar notificação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'unread' 
                ? 'Todas as suas notificações foram lidas.' 
                : 'Você receberá notificações sobre atividades importantes aqui.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}