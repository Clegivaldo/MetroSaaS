import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  action: string;
  table_name: string;
  entity_type: string;
  user_name: string;
  created_at: string;
}

const statusIcons = {
  CREATE: CheckCircle,
  UPDATE: AlertTriangle,
  DELETE: XCircle,
  LOGIN: Clock,
  LOGOUT: Clock,
};

const statusColors = {
  CREATE: 'text-green-500',
  UPDATE: 'text-blue-500',
  DELETE: 'text-red-500',
  LOGIN: 'text-purple-500',
  LOGOUT: 'text-gray-500',
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'CREATE': return 'criou';
    case 'UPDATE': return 'atualizou';
    case 'DELETE': return 'deletou';
    case 'LOGIN': return 'fez login';
    case 'LOGOUT': return 'fez logout';
    default: return action.toLowerCase();
  }
};

export function RecentActivity() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/dashboard/recent-activities', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.slice(0, 5)); // Mostrar apenas as 5 mais recentes
      }
    } catch (error) {
      console.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate('/atividades');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Atividade Recente</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Atividade Recente</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = statusIcons[activity.action as keyof typeof statusIcons] || Clock;
          const iconColor = statusColors[activity.action as keyof typeof statusColors] || 'text-gray-500';
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <IconComponent className={`w-5 h-5 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user_name || 'Sistema'}</span>
                  {' '}{getActionLabel(activity.action)}{' '}
                  <span className="font-medium">{activity.entity_type}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="mx-auto h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Nenhuma atividade recente</p>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <button 
          onClick={handleViewAll}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors mx-auto"
        >
          <Eye className="w-4 h-4" />
          <span>Ver todas as atividades</span>
        </button>
      </div>
    </div>
  );
}