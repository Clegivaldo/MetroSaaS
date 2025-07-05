import React, { useState, useEffect } from 'react';
import { Plus, Search, Wrench, Calendar, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const standardSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  serial_number: z.string().min(1, 'Número de série obrigatório'),
  type: z.string().min(1, 'Tipo obrigatório'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  calibration_date: z.string().min(1, 'Data calibração obrigatória'),
  expiration_date: z.string().min(1, 'Data vencimento obrigatória'),
  certificate_url: z.string().optional(),
  uncertainty: z.string().optional(),
  range_min: z.number().optional(),
  range_max: z.number().optional(),
  unit: z.string().optional(),
});

type StandardFormData = z.infer<typeof standardSchema>;

interface Standard {
  id: string;
  name: string;
  serial_number: string;
  type: string;
  manufacturer?: string;
  model?: string;
  calibration_date: string;
  expiration_date: string;
  status: 'valido' | 'vencido' | 'prestes_vencer';
  certificate_url?: string;
  uncertainty?: string;
  range_min?: number;
  range_max?: number;
  unit?: string;
  created_at: string;
  updated_at: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'valido':
      return { label: 'Válido', color: 'bg-green-100 text-green-800', icon: CheckCircle, iconColor: 'text-green-500' };
    case 'vencido':
      return { label: 'Vencido', color: 'bg-red-100 text-red-800', icon: AlertTriangle, iconColor: 'text-red-500' };
    case 'prestes_vencer':
      return { label: 'Prestes a Vencer', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, iconColor: 'text-yellow-500' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, iconColor: 'text-gray-500' };
  }
};

export function Standards() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<StandardFormData>({
    resolver: zodResolver(standardSchema),
  });

  useEffect(() => {
    fetchStandards();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchStandards = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`http://localhost:3001/api/standards?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStandards(data);
      } else {
        toast.error('Erro ao carregar padrões');
      }
    } catch (error) {
      toast.error('Erro ao carregar padrões');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StandardFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingStandard ? `http://localhost:3001/api/standards/${editingStandard.id}` : 'http://localhost:3001/api/standards';
      const method = editingStandard ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingStandard ? 'Padrão atualizado!' : 'Padrão criado!');
        setShowModal(false);
        setEditingStandard(null);
        reset();
        fetchStandards();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar padrão');
      }
    } catch (error) {
      toast.error('Erro ao salvar padrão');
    }
  };

  const handleEdit = (standard: Standard) => {
    setEditingStandard(standard);
    Object.keys(standard).forEach(key => {
      setValue(key as keyof StandardFormData, standard[key as keyof Standard] as any);
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar padrão?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/standards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Padrão deletado!');
        fetchStandards();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingStandard(null);
    reset();
    setShowModal(true);
  };

  const filteredStandards = standards.filter(standard => {
    const matchesSearch = standard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         standard.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (standard.manufacturer && standard.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || standard.status === statusFilter;
    const matchesType = !typeFilter || standard.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
        <h1 className="text-2xl font-bold text-gray-900">Padrões do Laboratório</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Padrão</span>
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
            <option value="valido">Válido</option>
            <option value="prestes_vencer">Prestes a Vencer</option>
            <option value="vencido">Vencido</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos tipos</option>
            <option value="Massa">Massa</option>
            <option value="Temperatura">Temperatura</option>
            <option value="Pressão">Pressão</option>
            <option value="Dimensional">Dimensional</option>
            <option value="Elétrico">Elétrico</option>
            <option value="Tempo">Tempo</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Padrão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número Série</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calibração</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStandards.map((standard) => {
                const statusInfo = getStatusInfo(standard.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={standard.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Wrench className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{standard.name}</div>
                          <div className="text-sm text-gray-500">{standard.manufacturer} {standard.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standard.serial_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{standard.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(standard.calibration_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(standard.expiration_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.iconColor}`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(standard)} className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(standard.id)} className="text-red-600 hover:text-red-900 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {standard.certificate_url && (
                          <a href={standard.certificate_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900 transition-colors">
                            Certificado
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStandards.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum padrão encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter || typeFilter ? 'Ajuste sua pesquisa.' : 'Cadastre seu primeiro padrão.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingStandard ? 'Editar Padrão' : 'Novo Padrão'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Padrão de Massa 1kg" />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Série *</label>
                    <input {...register('serial_number')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: PM-001" />
                    {errors.serial_number && <p className="mt-1 text-sm text-red-600">{errors.serial_number.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                    <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione</option>
                      <option value="Massa">Massa</option>
                      <option value="Temperatura">Temperatura</option>
                      <option value="Pressão">Pressão</option>
                      <option value="Dimensional">Dimensional</option>
                      <option value="Elétrico">Elétrico</option>
                      <option value="Tempo">Tempo</option>
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fabricante</label>
                    <input {...register('manufacturer')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Mettler Toledo" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                    <input {...register('model')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: XS205" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Calibração *</label>
                    <input type="date" {...register('calibration_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.calibration_date && <p className="mt-1 text-sm text-red-600">{errors.calibration_date.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Vencimento *</label>
                    <input type="date" {...register('expiration_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.expiration_date && <p className="mt-1 text-sm text-red-600">{errors.expiration_date.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Certificado</label>
                    <input {...register('certificate_url')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://..." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incerteza</label>
                    <input {...register('uncertainty')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: ±0.1 mg" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faixa Mínima</label>
                    <input type="number" step="any" {...register('range_min', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faixa Máxima</label>
                    <input type="number" step="any" {...register('range_max', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
                    <input {...register('unit')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: kg, °C, bar" />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingStandard(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingStandard ? 'Atualizar' : 'Criar'} Padrão
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