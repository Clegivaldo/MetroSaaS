import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, FileText, Award, Users, Building2, Wrench, LogIn } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  table_name: string;
  entity_type: string;
  user_name: string;
  user_email: string;
  record_id: string;
  old_values: string;
  new_values: string;
  ip_address: string;
  user_agent: string;
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
    case 'users': return User;
    default: return FileText;
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    case 'LOGIN': return 'bg-purple-100 text-purple-800';
    case 'LOGIN_FAILED': return 'bg-red-100 text-red-800';
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
    case 'LOGIN_FAILED': return 'Tentativa de login falhou';
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
        // Ordenar por data/hora decrescente
        setActivities(data.sort((a: Activity, b: Activity) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        setActivities([]);
      }
    } catch (error) {
      setActivities([]);
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
            <option value="LOGIN_FAILED">Login Falhou</option>
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
            <option value="users">Usuários</option>
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
              const isLoginActivity = activity.action === 'LOGIN' || activity.action === 'LOGIN_FAILED';
              
              return (
                <div 
                  key={activity.id} 
                  className={`flex items-start space-x-4 p-4 rounded-lg transition-colors ${
                    isLoginActivity 
                      ? 'hover:bg-blue-50 cursor-pointer border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {isLoginActivity ? (
                      <LogIn className="w-5 h-5 text-blue-600" />
                    ) : (
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColor}`}>
                        {getActionLabel(activity.action)}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-900">{activity.entity_type}</span>
                      {activity.record_id && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">ID: {activity.record_id}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>{activity.user_name || 'Sistema'}</span>
                      {activity.user_email && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{activity.user_email}</span>
                        </>
                      )}
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(activity.created_at + 'Z').toLocaleString('pt-BR', { 
                        timeZone: 'America/Sao_Paulo',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</span>
                    </div>

                    {activity.ip_address && (
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                        <span>IP: {activity.ip_address}</span>
                        {activity.user_agent && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs" title={activity.user_agent}>
                              {activity.user_agent.length > 50 ? activity.user_agent.substring(0, 50) + '...' : activity.user_agent}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {(activity.old_values || activity.new_values) && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          Ver detalhes da alteração
                        </summary>
                        <div className="mt-2 space-y-2">
                          {activity.old_values && (
                            <div>
                              <span className="text-xs font-medium text-gray-700">Valores anteriores:</span>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(JSON.parse(activity.old_values), null, 2)}
                              </pre>
                            </div>
                          )}
                          {activity.new_values && (
                            <div>
                              <span className="text-xs font-medium text-gray-700">Novos valores:</span>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(JSON.parse(activity.new_values), null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
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
                {searchTerm || actionFilter || entityFilter ? 'Tente ajustar os filtros.' : 'Nenhuma atividade registrada ainda.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}