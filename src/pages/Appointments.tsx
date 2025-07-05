import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Clock, User, MapPin, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const appointmentSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  equipment_id: z.string().optional(),
  scheduled_date: z.string().min(1, 'Data obrigatória'),
  service_type: z.string().min(1, 'Tipo serviço obrigatório'),
  description: z.string().optional(),
  technician_id: z.string().optional(),
  location: z.string().optional(),
  estimated_duration: z.number().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface Appointment {
  id: string;
  client_id: string;
  client_name: string;
  equipment_id?: string;
  equipment_name?: string;
  scheduled_date: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  service_type: string;
  description?: string;
  technician_id?: string;
  technician_name?: string;
  location?: string;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'agendado':
      return { label: 'Agendado', color: 'bg-blue-100 text-blue-800' };
    case 'em_andamento':
      return { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' };
    case 'concluido':
      return { label: 'Concluído', color: 'bg-green-100 text-green-800' };
    case 'cancelado':
      return { label: 'Cancelado', color: 'bg-red-100 text-red-800' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  }
};

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  useEffect(() => {
    fetchAppointments();
    fetchClients();
    fetchUsers();
  }, [searchTerm, statusFilter]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:3001/api/appointments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        toast.error('Erro ao carregar agendamentos');
      }
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes');
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

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingAppointment ? `http://localhost:3001/api/appointments/${editingAppointment.id}` : 'http://localhost:3001/api/appointments';
      const method = editingAppointment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingAppointment ? 'Agendamento atualizado!' : 'Agendamento criado!');
        setShowModal(false);
        setEditingAppointment(null);
        reset();
        fetchAppointments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar agendamento');
      }
    } catch (error) {
      toast.error('Erro ao salvar agendamento');
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setValue('client_id', appointment.client_id);
    setValue('equipment_id', appointment.equipment_id || '');
    setValue('scheduled_date', appointment.scheduled_date.slice(0, 16));
    setValue('service_type', appointment.service_type);
    setValue('description', appointment.description || '');
    setValue('technician_id', appointment.technician_id || '');
    setValue('location', appointment.location || '');
    setValue('estimated_duration', appointment.estimated_duration);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar agendamento?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Agendamento deletado!');
        fetchAppointments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos status</option>
            <option value="agendado">Agendado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => {
                const statusInfo = getStatusInfo(appointment.status);
                
                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{appointment.client_name}</div>
                          {appointment.equipment_name && (
                            <div className="text-sm text-gray-500">{appointment.equipment_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.service_type}</div>
                      {appointment.description && (
                        <div className="text-sm text-gray-500">{appointment.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(appointment.scheduled_date).toLocaleString('pt-BR')}
                      </div>
                      {appointment.estimated_duration && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {appointment.estimated_duration} min
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.technician_name || 'Não atribuído'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(appointment)} className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(appointment.id)} className="text-red-600 hover:text-red-900 transition-colors">
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

      {appointments.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter ? 'Ajuste sua pesquisa.' : 'Crie seu primeiro agendamento.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                    <select {...register('client_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço *</label>
                    <select {...register('service_type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione</option>
                      <option value="Calibração">Calibração</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Verificação">Verificação</option>
                      <option value="Consultoria">Consultoria</option>
                    </select>
                    {errors.service_type && <p className="mt-1 text-sm text-red-600">{errors.service_type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data e Hora *</label>
                    <input type="datetime-local" {...register('scheduled_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.scheduled_date && <p className="mt-1 text-sm text-red-600">{errors.scheduled_date.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Técnico</label>
                    <select {...register('technician_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione técnico</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Local</label>
                    <input {...register('location')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Local do serviço" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duração (min)</label>
                    <input type="number" {...register('estimated_duration', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="120" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Detalhes do serviço..." />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingAppointment(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingAppointment ? 'Atualizar' : 'Criar'} Agendamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}