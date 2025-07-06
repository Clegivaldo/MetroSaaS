import React, { useState, useEffect } from 'react';
import { Plus, Search, Wrench, Calendar, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const maintenanceSchema = z.object({
  equipment_id: z.string().min(1, 'Equipamento obrigatório'),
  type: z.string().min(1, 'Tipo obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  scheduled_date: z.string().optional(),
  technician_id: z.string().optional(),
  cost: z.number().optional(),
  observations: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface Maintenance {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_serial: string;
  type: 'preventiva' | 'corretiva';
  description: string;
  scheduled_date?: string;
  completed_date?: string;
  technician_id?: string;
  technician_name?: string;
  cost?: number;
  observations?: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  created_at: string;
  updated_at: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'agendada':
      return { label: 'Agendada', color: 'bg-blue-100 text-blue-800', icon: Calendar, iconColor: 'text-blue-500' };
    case 'em_andamento':
      return { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: Wrench, iconColor: 'text-yellow-500' };
    case 'concluida':
      return { label: 'Concluída', color: 'bg-green-100 text-green-800', icon: CheckCircle, iconColor: 'text-green-500' };
    case 'cancelada':
      return { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: AlertTriangle, iconColor: 'text-red-500' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, iconColor: 'text-gray-500' };
  }
};

const getTypeInfo = (type: string) => {
  switch (type) {
    case 'preventiva':
      return { label: 'Preventiva', color: 'bg-green-100 text-green-800' };
    case 'corretiva':
      return { label: 'Corretiva', color: 'bg-orange-100 text-orange-800' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  }
};

export function Maintenance() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
  });

  useEffect(() => {
    fetchMaintenance();
    fetchEquipment();
    fetchUsers();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchMaintenance = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`http://localhost:3001/api/maintenance?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenance(data);
      } else {
        toast.error('Erro ao carregar manutenções');
      }
    } catch (error) {
      toast.error('Erro ao carregar manutenções');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/standards', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos');
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
        setUsers(data.filter((u: any) => u.role === 'tecnico'));
      }
    } catch (error) {
      console.error('Erro ao carregar usuários');
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingMaintenance ? `http://localhost:3001/api/maintenance/${editingMaintenance.id}` : 'http://localhost:3001/api/maintenance';
      const method = editingMaintenance ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingMaintenance ? 'Manutenção atualizada!' : 'Manutenção criada!');
        setShowModal(false);
        setEditingMaintenance(null);
        reset();
        fetchMaintenance();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar manutenção');
      }
    } catch (error) {
      toast.error('Erro ao salvar manutenção');
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setValue('equipment_id', maintenance.equipment_id);
    setValue('type', maintenance.type);
    setValue('description', maintenance.description);
    setValue('scheduled_date', maintenance.scheduled_date ? maintenance.scheduled_date.split('T')[0] : '');
    setValue('technician_id', maintenance.technician_id || '');
    setValue('cost', maintenance.cost);
    setValue('observations', maintenance.observations || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar manutenção?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/maintenance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Manutenção deletada!');
        fetchMaintenance();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingMaintenance(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Controle de Manutenção</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Manutenção
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar manutenção..."
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
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
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
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Manutenções */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Agendada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Custo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenance.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                const typeInfo = getTypeInfo(item.type);
                const StatusIcon = statusInfo.icon;
                const TypeIcon = Wrench;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.equipment_name}</div>
                        <div className="text-sm text-gray-500">{item.equipment_serial}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.technician_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.iconColor}`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.cost ? `R$ ${item.cost.toFixed(2)}` : '-'}
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
              {editingMaintenance ? 'Editar Manutenção' : 'Nova Manutenção'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento *</label>
                  <select
                    {...register('equipment_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um equipamento</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} - {eq.serial_number}
                      </option>
                    ))}
                  </select>
                  {errors.equipment_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.equipment_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="preventiva">Preventiva</option>
                    <option value="corretiva">Corretiva</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Agendada</label>
                  <input
                    type="date"
                    {...register('scheduled_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
                  <select
                    {...register('technician_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um técnico</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('cost', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva a manutenção..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  {...register('observations')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações adicionais..."
                />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMaintenance ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 