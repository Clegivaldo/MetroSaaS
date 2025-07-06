import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Folder, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  sigla: z.string().min(1, 'Sigla obrigatória'),
  color: z.string().min(1, 'Cor obrigatória'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  sigla: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function DocumentCategories() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/document-categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error('Erro ao carregar categorias');
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingCategory 
        ? `http://localhost:3001/api/document-categories/${editingCategory.id}`
        : 'http://localhost:3001/api/document-categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
        setShowModal(false);
        setEditingCategory(null);
        reset();
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar categoria');
      }
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleEdit = (category: DocumentCategory) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('description', category.description || '');
    setValue('sigla', category.sigla);
    setValue('color', category.color);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/document-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Categoria excluída com sucesso!');
        fetchCategories();
      } else {
        toast.error('Erro ao excluir categoria');
      }
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colorOptions = [
    { value: 'blue', label: 'Azul', class: 'bg-blue-100 text-blue-800' },
    { value: 'green', label: 'Verde', class: 'bg-green-100 text-green-800' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-100 text-red-800' },
    { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-100 text-yellow-800' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-100 text-purple-800' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-100 text-pink-800' },
    { value: 'indigo', label: 'Índigo', class: 'bg-indigo-100 text-indigo-800' },
    { value: 'gray', label: 'Cinza', class: 'bg-gray-100 text-gray-800' },
  ];

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'green': return 'text-green-600 bg-green-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      case 'pink': return 'text-pink-600 bg-pink-100';
      case 'indigo': return 'text-indigo-600 bg-indigo-100';
      case 'gray': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getColorLabel = (color: string) => {
    switch (color) {
      case 'blue': return 'Azul';
      case 'green': return 'Verde';
      case 'red': return 'Vermelho';
      case 'yellow': return 'Amarelo';
      case 'purple': return 'Roxo';
      case 'pink': return 'Rosa';
      case 'indigo': return 'Índigo';
      case 'gray': return 'Cinza';
      default: return 'Azul';
    }
  };

  const getIconColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      case 'purple': return 'text-purple-600';
      case 'pink': return 'text-pink-600';
      case 'indigo': return 'text-indigo-600';
      case 'gray': return 'text-gray-600';
      default: return 'text-blue-600';
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
        <h1 className="text-2xl font-bold text-gray-900">Categorias de Documentos</h1>
        <button
          onClick={() => { setEditingCategory(null); reset(); setShowModal(true); }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => {
            const colorOption = colorOptions.find(opt => opt.value === category.color);
            const colorClass = colorOption?.class || 'bg-gray-100 text-gray-800';
            
            return (
              <div key={category.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Folder className={`w-5 h-5 ${getIconColorClass(category.color)}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.sigla && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorClass(category.color)} mt-1`}>
                          {category.sigla}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                )}
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass(category.color)}`}>
                  {getColorLabel(category.color)}
                </span>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar os filtros.' : 'Comece criando uma nova categoria de documento.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sigla *</label>
                    <input {...register('sigla')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.sigla && <p className="mt-1 text-sm text-red-600">{errors.sigla.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor *</label>
                  <select {...register('color')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Selecione uma cor</option>
                    <option value="blue">Azul</option>
                    <option value="green">Verde</option>
                    <option value="red">Vermelho</option>
                    <option value="yellow">Amarelo</option>
                    <option value="purple">Roxo</option>
                    <option value="pink">Rosa</option>
                    <option value="indigo">Índigo</option>
                    <option value="gray">Cinza</option>
                  </select>
                  {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingCategory ? 'Atualizar' : 'Criar'} Categoria</span>
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