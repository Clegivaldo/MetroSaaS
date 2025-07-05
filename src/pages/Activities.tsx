import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, FileText, Award, Users, Building2, Wrench } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  table_name: string;
  entity_type: string;
  user_name: string;
  created_at: string;
}

const getActivityIcon = (tableName: string) => {
  switch (tableName) {
    case 'clients': return Users;
    case 'certificates': return Award;
    case 'standards': return Wrench;
    case 'appointments': return Calendar;
    case 'documents': return FileText;
    case 'suppliers': return Building2;
    default: return FileText;
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    case 'LOGIN': return 'bg-purple-100 text-purple-800';
    case 'LOGOUT': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'CREATE': return 'Criou';
    case 'UPDATE': return 'Atualizou';
    case 'DELETE': return 'Deletou';
    case 'LOGIN': return 'Fez login';
    case 'LOGOUT': return 'Fez logout';
    default: return action;
  }
};

export function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
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
        setActivities(data);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || activity.action === actionFilter;
    const matchesEntity = !entityFilter || activity.table_name === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Todas as Atividades</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar por usuário ou entidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todas ações</option>
            <option value="CREATE">Criação</option>
            <option value="UPDATE">Atualização</option>
            <option value="DELETE">Exclusão</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todas entidades</option>
            <option value="clients">Clientes</option>
            <option value="certificates">Certificados</option>
            <option value="standards">Padrões</option>
            <option value="appointments">Agendamentos</option>
            <option value="documents">Documentos</option>
            <option value="suppliers">Fornecedores</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Histórico de Atividades</h3>
          
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const IconComponent = getActivityIcon(activity.table_name);
              const actionColor = getActivityColor(activity.action);
              
              return (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColor}`}>
                        {getActionLabel(activity.action)}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-900">{activity.entity_type}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{activity.user_name || 'Sistema'}</span>
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(activity.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || actionFilter || entityFilter ? 'Tente ajustar os filtros.' : 'Ainda não há atividades registradas.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}