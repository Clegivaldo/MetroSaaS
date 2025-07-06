import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Grandeza {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function Grandezas() {
  const [grandezas, setGrandezas] = useState<Grandeza[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrandeza, setEditingGrandeza] = useState<Grandeza | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchGrandezas();
  }, []);

  const fetchGrandezas = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/grandezas', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGrandezas(data);
      } else {
        toast.error('Erro ao carregar grandezas');
      }
    } catch (error) {
      toast.error('Erro ao carregar grandezas');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingGrandeza 
        ? `http://localhost:3001/api/grandezas/${editingGrandeza.id}`
        : 'http://localhost:3001/api/grandezas';
      const method = editingGrandeza ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingGrandeza ? 'Grandeza atualizada!' : 'Grandeza criada!');
        setShowModal(false);
        setEditingGrandeza(null);
        reset();
        fetchGrandezas();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar grandeza');
      }
    } catch (error) {
      toast.error('Erro ao salvar grandeza');
    }
  };

  const handleEdit = (grandeza: Grandeza) => {
    setEditingGrandeza(grandeza);
    setValue('name', grandeza.name);
    setValue('description', grandeza.description);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta grandeza?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/grandezas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Grandeza deletada!');
        fetchGrandezas();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar grandeza');
      }
    } catch (error) {
      toast.error('Erro ao deletar grandeza');
    }
  };

  const openCreateModal = () => {
    setEditingGrandeza(null);
    reset();
    setShowModal(true);
  };

  const filteredGrandezas = grandezas.filter(grandeza =>
    grandeza.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grandeza.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Grandezas</h1>
          <p className="text-gray-600">Gerencie as grandezas de medição do laboratório</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Grandeza</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar grandezas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGrandezas.map((grandeza) => (
            <div key={grandeza.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{grandeza.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{grandeza.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Criado em {new Date(grandeza.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(grandeza)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(grandeza.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGrandezas.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">Nenhuma grandeza encontrada</h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Ajuste sua pesquisa.' : 'Cadastre sua primeira grandeza.'}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingGrandeza ? 'Editar Grandeza' : 'Nova Grandeza'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    {...register('name', { required: 'Nome é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Elétrica"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição da grandeza..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingGrandeza(null); reset(); }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingGrandeza ? 'Atualizar' : 'Criar'} Grandeza</span>
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