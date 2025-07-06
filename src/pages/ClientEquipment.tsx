import React, { useState, useEffect } from 'react';
import { Plus, Search, Wrench, Calendar, AlertTriangle, CheckCircle, Edit, Trash2, FileText, User, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const equipmentSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  type_id: z.string().min(1, 'Tipo obrigatório'),
  brand_id: z.string().optional(),
  model_id: z.string().optional(),
  identificacao: z.string().optional(),
  serial_number: z.string().optional(),
  scales: z.array(z.object({
    name: z.string().min(1, 'Nome da escala obrigatório'),
    min: z.number({ invalid_type_error: 'Valor mínimo deve ser número' }),
    max: z.number({ invalid_type_error: 'Valor máximo deve ser número' }),
    unit: z.string().min(1, 'Unidade obrigatória'),
  })).min(1, 'Pelo menos uma escala é obrigatória'),
}).refine((data) => {
  return data.identificacao || data.serial_number;
}, {
  message: "Identificação ou número de série é obrigatório",
  path: ["identificacao"]
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface Scale {
  name: string;
  min: number;
  max: number;
  unit: string;
}

interface ClientEquipment {
  id: string;
  client_id: string;
  client_name: string;
  type_id: string;
  type_name?: string;
  brand_id?: string;
  brand_name?: string;
  model_id?: string;
  model_name?: string;
  identificacao?: string;
  serial_number?: string;
  scales: Scale[];
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface EquipmentType {
  id: string;
  name: string;
  description?: string;
  grandeza: string;
}

interface Brand {
  id: string;
  name: string;
  description?: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
  brand_name?: string;
  equipment_type_id: string;
  equipment_type_name?: string;
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

export function ClientEquipment() {
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<ClientEquipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', description: '' });
  const [newModel, setNewModel] = useState({ name: '', description: '' });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
  });

  const watchTypeId = watch('type_id');
  const watchBrandId = watch('brand_id');

  useEffect(() => {
    fetchEquipments();
    fetchClients();
    fetchEquipmentTypes();
  }, [searchTerm, statusFilter, clientFilter]);

  useEffect(() => {
    if (watchTypeId) {
      fetchBrandsByType(watchTypeId);
    }
  }, [watchTypeId]);

  useEffect(() => {
    if (watchBrandId && watchTypeId) {
      fetchModelsByBrandAndType(watchBrandId, watchTypeId);
    }
  }, [watchBrandId, watchTypeId]);

  const fetchEquipments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (clientFilter) params.append('client_id', clientFilter);

      const response = await fetch(`http://localhost:3001/api/client-equipment?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEquipments(data);
      } else {
        toast.error('Erro ao carregar equipamentos');
      }
    } catch (error) {
      toast.error('Erro ao carregar equipamentos');
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

  const fetchEquipmentTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/equipment-types', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEquipmentTypes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de equipamentos');
    }
  };

  const fetchBrandsByType = async (typeId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/brands?equipment_type_id=${typeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Erro ao carregar marcas');
    }
  };

  const fetchModelsByBrandAndType = async (brandId: string, typeId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/models?brand_id=${brandId}&equipment_type_id=${typeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Erro ao carregar modelos');
    }
  };

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      setUploading(true);

      const token = localStorage.getItem('auth_token');
      const url = editingEquipment ? `http://localhost:3001/api/client-equipment/${editingEquipment.id}` : 'http://localhost:3001/api/client-equipment';
      const method = editingEquipment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingEquipment ? 'Equipamento atualizado!' : 'Equipamento criado!');
        setShowModal(false);
        setEditingEquipment(null);
        reset();
        fetchEquipments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar equipamento');
      }
    } catch (error) {
      toast.error('Erro ao salvar equipamento');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (equipment: ClientEquipment) => {
    setEditingEquipment(equipment);
    setValue('client_id', equipment.client_id);
    setValue('type_id', equipment.type_id);
    setValue('brand_id', equipment.brand_id || '');
    setValue('model_id', equipment.model_id || '');
    setValue('identificacao', equipment.identificacao || '');
    setValue('serial_number', equipment.serial_number || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar equipamento?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/client-equipment/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Equipamento deletado!');
        fetchEquipments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar equipamento');
      }
    } catch (error) {
      toast.error('Erro ao deletar equipamento');
    }
  };

  const openCreateModal = () => {
    setEditingEquipment(null);
    reset();
    setShowModal(true);
  };

  const resetForm = () => {
    reset();
    setEditingEquipment(null);
  };

  const addScale = () => {
    const currentScales = watch('scales') || [];
    setValue('scales', [...currentScales, { name: '', min: 0, max: 0, unit: '' }]);
  };

  const removeScale = (index: number) => {
    const currentScales = watch('scales') || [];
    const newScales = currentScales.filter((_, i) => i !== index);
    setValue('scales', newScales);
  };

  const updateScale = (index: number, field: keyof Scale, value: string | number) => {
    const currentScales = watch('scales') || [];
    const newScales = [...currentScales];
    newScales[index] = { ...newScales[index], [field]: value };
    setValue('scales', newScales);
  };

  const createBrand = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newBrand.name,
          description: newBrand.description,
          equipment_type_id: watchTypeId
        }),
      });

      if (response.ok) {
        toast.success('Marca criada com sucesso!');
        setShowBrandModal(false);
        setNewBrand({ name: '', description: '' });
        fetchBrandsByType(watchTypeId);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar marca');
      }
    } catch (error) {
      toast.error('Erro ao criar marca');
    }
  };

  const createModel = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newModel.name,
          description: newModel.description,
          brand_id: watchBrandId,
          equipment_type_id: watchTypeId
        }),
      });

      if (response.ok) {
        toast.success('Modelo criado com sucesso!');
        setShowModelModal(false);
        setNewModel({ name: '', description: '' });
        fetchModelsByBrandAndType(watchBrandId, watchTypeId);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar modelo');
      }
    } catch (error) {
      toast.error('Erro ao criar modelo');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Equipamentos de Clientes</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Equipamento</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar equipamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos os clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipments.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Wrench className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{equipment.name}</div>
                        <div className="text-sm text-gray-500">{equipment.type_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipment.client_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipment.type_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {equipment.brand_name && equipment.model_name ? `${equipment.brand_name} ${equipment.model_name}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {equipment.identificacao || equipment.serial_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {equipment.scales?.length || 0} escala(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(equipment)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(equipment.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {equipments.length === 0 && (
          <div className="text-center py-8">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum equipamento encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar os filtros.' : 'Comece criando um novo equipamento de cliente.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Equipamento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                    <select {...register('client_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione o cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Equipamento *</label>
                    <select {...register('type_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione o tipo</option>
                      {equipmentTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    {errors.type_id && <p className="mt-1 text-sm text-red-600">{errors.type_id.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                      <button
                        type="button"
                        onClick={() => setShowBrandModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        + Nova Marca
                      </button>
                    </div>
                    <select {...register('brand_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione a marca</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                      <button
                        type="button"
                        onClick={() => setShowModelModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        + Novo Modelo
                      </button>
                    </div>
                    <select {...register('model_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione o modelo</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Identificação</label>
                    <input {...register('identificacao')} placeholder="Ex: PAT-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Série</label>
                    <input {...register('serial_number')} placeholder="Ex: SN123456" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                {/* Escalas */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Escalas</h3>
                    <button
                      type="button"
                      onClick={addScale}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Escala</span>
                    </button>
                  </div>

                  {watch('scales')?.map((scale, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Escala</label>
                        <input
                          value={scale.name}
                          onChange={(e) => updateScale(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Temperatura"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mínimo</label>
                        <input
                          type="number"
                          value={scale.min}
                          onChange={(e) => updateScale(index, 'min', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor Máximo</label>
                        <input
                          type="number"
                          value={scale.max}
                          onChange={(e) => updateScale(index, 'max', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
                          <input
                            value={scale.unit}
                            onChange={(e) => updateScale(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: °C"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeScale(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {errors.scales && <p className="mt-1 text-sm text-red-600">{errors.scales.message}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                    <span>{editingEquipment ? 'Atualizar' : 'Criar'} Equipamento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Marca */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Nova Marca</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Fluke"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={newBrand.description}
                    onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição da marca"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowBrandModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createBrand}
                    disabled={!newBrand.name}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Criar Marca
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Modelo */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Novo Modelo</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 1551A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={newModel.description}
                    onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição do modelo"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModelModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createModel}
                    disabled={!newModel.name}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Criar Modelo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 