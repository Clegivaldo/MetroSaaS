import React, { useState, useEffect } from 'react';
import { Plus, Search, Wrench, Edit, Trash2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface EquipmentType {
  id: string;
  name: string;
  description?: string;
  grandeza: string;
  created_at: string;
  updated_at: string;
}

interface Grandeza {
  id: string;
  name: string;
  description?: string;
}

export function EquipmentTypes() {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [grandezas, setGrandezas] = useState<Grandeza[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchEquipmentTypes();
    fetchGrandezas();
  }, []);

  const fetchEquipmentTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/equipment-types', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEquipmentTypes(data);
      } else {
        toast.error('Erro ao carregar tipos de equipamentos');
      }
    } catch (error) {
      toast.error('Erro ao carregar tipos de equipamentos');
    }
  };

  const fetchGrandezas = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/grandezas', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGrandezas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar grandezas');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingType 
        ? `http://localhost:3001/api/equipment-types/${editingType.id}`
        : 'http://localhost:3001/api/equipment-types';
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingType ? 'Tipo atualizado!' : 'Tipo criado!');
        setShowModal(false);
        setEditingType(null);
        reset();
        fetchEquipmentTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar tipo');
      }
    } catch (error) {
      toast.error('Erro ao salvar tipo');
    }
  };

  const handleEdit = (type: EquipmentType) => {
    setEditingType(type);
    setValue('name', type.name);
    setValue('description', type.description || '');
    setValue('grandeza', type.grandeza);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este tipo?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/equipment-types/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Tipo deletado!');
        fetchEquipmentTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar tipo');
      }
    } catch (error) {
      toast.error('Erro ao deletar tipo');
    }
  };

  const openCreateModal = () => {
    setEditingType(null);
    reset();
    setShowModal(true);
  };

  const filteredTypes = equipmentTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Equipamentos</h1>
          <p className="text-gray-600">Gerencie os tipos de equipamentos do laboratório</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Tipo</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar tipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTypes.map((type) => (
            <div key={type.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{type.name}</h3>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                  <p className="text-sm text-blue-600 mt-2 font-medium">{type.grandeza}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Criado em {new Date(type.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(type)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTypes.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum tipo encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Ajuste sua pesquisa.' : 'Cadastre seu primeiro tipo de equipamento.'}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingType ? 'Editar Tipo' : 'Novo Tipo de Equipamento'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    {...register('name', { required: 'Nome é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Termômetro"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição do tipo de equipamento..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grandeza *</label>
                  <select
                    {...register('grandeza', { required: 'Grandeza é obrigatória' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma grandeza</option>
                    {grandezas.map((grandeza) => (
                      <option key={grandeza.id} value={grandeza.name}>{grandeza.name}</option>
                    ))}
                  </select>
                  {errors.grandeza && <p className="mt-1 text-sm text-red-600">{errors.grandeza.message as string}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingType(null); reset(); }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingType ? 'Atualizar' : 'Criar'} Tipo</span>
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