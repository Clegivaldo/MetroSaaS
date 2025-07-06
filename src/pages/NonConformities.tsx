import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Calendar, CheckCircle, Edit, Trash2, Clock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const nonConformitySchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  type: z.string().min(1, 'Tipo obrigatório'),
  severity: z.string().min(1, 'Severidade obrigatória'),
  detected_date: z.string().min(1, 'Data de detecção obrigatória'),
  responsible_person: z.string().optional(),
  due_date: z.string().optional(),
});

type NonConformityFormData = z.infer<typeof nonConformitySchema>;

interface NonConformity {
  id: string;
  title: string;
  description: string;
  type: 'processo' | 'equipamento' | 'documento' | 'treinamento' | 'outro';
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  detected_by: string;
  detected_by_name: string;
  detected_date: string;
  status: 'aberta' | 'em_analise' | 'em_correcao' | 'fechada';
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  responsible_person?: string;
  responsible_person_name?: string;
  due_date?: string;
  completion_date?: string;
  effectiveness_review?: string;
  created_at: string;
  updated_at: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'aberta':
      return { label: 'Aberta', color: 'bg-red-100 text-red-800', icon: AlertTriangle, iconColor: 'text-red-500' };
    case 'em_analise':
      return { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-800', icon: Clock, iconColor: 'text-yellow-500' };
    case 'em_correcao':
      return { label: 'Em Correção', color: 'bg-blue-100 text-blue-800', icon: Clock, iconColor: 'text-blue-500' };
    case 'fechada':
      return { label: 'Fechada', color: 'bg-green-100 text-green-800', icon: CheckCircle, iconColor: 'text-green-500' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, iconColor: 'text-gray-500' };
  }
};

const getSeverityInfo = (severity: string) => {
  switch (severity) {
    case 'baixa':
      return { label: 'Baixa', color: 'bg-green-100 text-green-800' };
    case 'media':
      return { label: 'Média', color: 'bg-yellow-100 text-yellow-800' };
    case 'alta':
      return { label: 'Alta', color: 'bg-orange-100 text-orange-800' };
    case 'critica':
      return { label: 'Crítica', color: 'bg-red-100 text-red-800' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  }
};

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'processo':
      return { label: 'Processo', color: 'bg-blue-100 text-blue-800' };
    case 'equipamento':
      return { label: 'Equipamento', color: 'bg-purple-100 text-purple-800' };
    case 'documento':
      return { label: 'Documento', color: 'bg-indigo-100 text-indigo-800' };
    case 'treinamento':
      return { label: 'Treinamento', color: 'bg-teal-100 text-teal-800' };
    case 'outro':
      return { label: 'Outro', color: 'bg-gray-100 text-gray-800' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  }
};

export function NonConformities() {
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNonConformity, setEditingNonConformity] = useState<NonConformity | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<NonConformityFormData>({
    resolver: zodResolver(nonConformitySchema),
  });

  useEffect(() => {
    fetchNonConformities();
    fetchUsers();
  }, [searchTerm, statusFilter, typeFilter, severityFilter]);

  const fetchNonConformities = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (severityFilter) params.append('severity', severityFilter);

      const response = await fetch(`http://localhost:3001/api/non-conformities?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNonConformities(data);
      } else {
        toast.error('Erro ao carregar não conformidades');
      }
    } catch (error) {
      toast.error('Erro ao carregar não conformidades');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários');
    }
  };

  const onSubmit = async (data: NonConformityFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingNonConformity ? `http://localhost:3001/api/non-conformities/${editingNonConformity.id}` : 'http://localhost:3001/api/non-conformities';
      const method = editingNonConformity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingNonConformity ? 'Não conformidade atualizada!' : 'Não conformidade registrada!');
        setShowModal(false);
        setEditingNonConformity(null);
        reset();
        fetchNonConformities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar não conformidade');
      }
    } catch (error) {
      toast.error('Erro ao salvar não conformidade');
    }
  };

  const handleEdit = (nonConformity: NonConformity) => {
    setEditingNonConformity(nonConformity);
    setValue('title', nonConformity.title);
    setValue('description', nonConformity.description);
    setValue('type', nonConformity.type);
    setValue('severity', nonConformity.severity);
    setValue('detected_date', nonConformity.detected_date.split('T')[0]);
    setValue('responsible_person', nonConformity.responsible_person || '');
    setValue('due_date', nonConformity.due_date ? nonConformity.due_date.split('T')[0] : '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar não conformidade?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/non-conformities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Não conformidade deletada!');
        fetchNonConformities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingNonConformity(null);
    reset();
    setShowModal(true);
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Não Conformidades</h1>
        <button
          onClick={openCreateModal}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Não Conformidade
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar não conformidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="aberta">Aberta</option>
              <option value="em_analise">Em Análise</option>
              <option value="em_correcao">Em Correção</option>
              <option value="fechada">Fechada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="processo">Processo</option>
              <option value="equipamento">Equipamento</option>
              <option value="documento">Documento</option>
              <option value="treinamento">Treinamento</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severidade</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Não Conformidades */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detectada Por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Detecção
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nonConformities.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                const severityInfo = getSeverityInfo(item.severity);
                const typeInfo = getTypeInfo(item.type);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityInfo.color}`}>
                        {severityInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.detected_by_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.detected_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.responsible_person_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.iconColor}`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingNonConformity ? 'Editar Não Conformidade' : 'Nova Não Conformidade'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Título da não conformidade"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="processo">Processo</option>
                    <option value="equipamento">Equipamento</option>
                    <option value="documento">Documento</option>
                    <option value="treinamento">Treinamento</option>
                    <option value="outro">Outro</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severidade *</label>
                  <select
                    {...register('severity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione a severidade</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                  {errors.severity && (
                    <p className="text-red-500 text-sm mt-1">{errors.severity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Detecção *</label>
                  <input
                    type="date"
                    {...register('detected_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.detected_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.detected_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <select
                    {...register('responsible_person')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um responsável</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
                  <input
                    type="date"
                    {...register('due_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva a não conformidade..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {editingNonConformity ? 'Atualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 