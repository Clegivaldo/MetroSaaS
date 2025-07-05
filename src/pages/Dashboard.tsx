import React, { useState, useEffect } from 'react';
import { Users, Award, Calendar, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DashboardStats {
  clients: number;
  certificates: number;
  todayAppointments: number;
  expiringCertificates: number;
  expiringStandards: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    certificates: 0,
    todayAppointments: 0,
    expiringCertificates: 0,
    expiringStandards: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Novo Cliente',
      description: 'Cadastrar cliente',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      action: () => window.location.href = '/clientes'
    },
    {
      title: 'Emitir Certificado',
      description: 'Gerar novo certificado',
      icon: Award,
      color: 'bg-green-100 text-green-600',
      action: () => window.location.href = '/certificados'
    },
    {
      title: 'Novo Agendamento',
      description: 'Agendar serviço',
      icon: Calendar,
      color: 'bg-yellow-100 text-yellow-600',
      action: () => window.location.href = '/agendamentos'
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Aqui está um resumo das atividades do seu laboratório
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total de Clientes"
          value={stats.clients}
          change="+12% este mês"
          changeType="increase"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Certificados Ativos"
          value={stats.certificates}
          change="+5% este mês"
          changeType="increase"
          icon={Award}
          color="green"
        />
        <StatsCard
          title="Agendamentos Hoje"
          value={stats.todayAppointments}
          change="2 pendentes"
          changeType="neutral"
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Certificados Vencendo"
          value={stats.expiringCertificates}
          change="Próximos 30 dias"
          changeType="decrease"
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Padrões Vencendo"
          value={stats.expiringStandards}
          change="Próximos 30 dias"
          changeType="decrease"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Certificados por Mês
              </h3>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-2">
                <option>Últimos 6 meses</option>
                <option>Últimos 12 meses</option>
              </select>
            </div>
            
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p>Gráfico de certificados será exibido aqui</p>
                <p className="text-sm text-gray-400 mt-1">Dados em tempo real do sistema</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts Section */}
      {(stats.expiringCertificates > 0 || stats.expiringStandards > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Atenção: Itens próximos ao vencimento
              </h3>
              <div className="space-y-1 text-sm text-yellow-700">
                {stats.expiringCertificates > 0 && (
                  <p>• {stats.expiringCertificates} certificado(s) vencendo nos próximos 30 dias</p>
                )}
                {stats.expiringStandards > 0 && (
                  <p>• {stats.expiringStandards} padrão(ões) vencendo nos próximos 30 dias</p>
                )}
              </div>
              <div className="mt-3 flex space-x-3">
                <button 
                  onClick={() => window.location.href = '/certificados'}
                  className="text-sm bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Ver Certificados
                </button>
                <button 
                  onClick={() => window.location.href = '/padroes'}
                  className="text-sm bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Ver Padrões
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}