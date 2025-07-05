import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Play, Clock, Edit, Trash2, CheckCircle, User, Monitor } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const trainingSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  youtube_url: z.string().url('URL inválida').min(1, 'URL obrigatória'),
  duration: z.number().min(1, 'Duração obrigatória'),
  category: z.string().min(1, 'Categoria obrigatória'),
  required_for: z.array(z.string()).min(1, 'Selecione pelo menos um perfil'),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

interface SystemTraining {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  duration: number;
  category: string;
  required_for: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

// Mock data para treinamentos do sistema
const mockSystemTrainings: SystemTraining[] = [
  {
    id: '1',
    title: 'Introdução ao MetroSaaS',
    description: 'Aprenda os conceitos básicos e como navegar pelo sistema',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 15,
    category: 'Básico',
    required_for: '["admin", "tecnico", "cliente"]',
    status: 'ativo',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    title: 'Cadastro de Clientes',
    description: 'Como cadastrar e gerenciar clientes no sistema',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 20,
    category: 'Gestão',
    required_for: '["admin", "tecnico"]',
    status: 'ativo',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    title: 'Emissão de Certificados',
    description: 'Processo completo para emitir certificados de calibração',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 30,
    category: 'Certificação',
    required_for: '["admin", "tecnico"]',
    status: 'ativo',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    title: 'Gestão de Padrões',
    description: 'Como cadastrar e controlar padrões do laboratório',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 25,
    category: 'Técnico',
    required_for: '["admin", "tecnico"]',
    status: 'ativo',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '5',
    title: 'Agendamentos e Calendário',
    description: 'Como usar o sistema de agendamentos',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 18,
    category: 'Gestão',
    required_for: '["admin", "tecnico"]',
    status: 'ativo',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '6',
    title: 'Configurações do Sistema',
    description: 'Como configurar SMTP, templates e outras configurações',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 35,
    category: 'Administração',
    required_for: '["admin"]',
    status: 'ativo',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

export function SystemTrainings() {
  const [trainings, setTrainings] = useState<SystemTraining[]>(mockSystemTrainings);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<SystemTraining | null>(null);
  const [completedTrainings, setCompletedTrainings] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
  });

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || training.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const onSubmit = async (data: TrainingFormData) => {
    try {
      const newTraining: SystemTraining = {
        id: Date.now().toString(),
        ...data,
        required_for: JSON.stringify(data.required_for),
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingTraining) {
        setTrainings(prev => prev.map(t => t.id === editingTraining.id ? { ...newTraining, id: editingTraining.id } : t));
        toast.success('Treinamento atualizado!');
      } else {
        setTrainings(prev => [...prev, newTraining]);
        toast.success('Treinamento criado!');
      }

      setShowModal(false);
      setEditingTraining(null);
      reset();
    } catch (error) {
      toast.error('Erro ao salvar treinamento');
    }
  };

  const handleEdit = (training: SystemTraining) => {
    setEditingTraining(training);
    setValue('title', training.title);
    setValue('description', training.description || '');
    setValue('youtube_url', training.youtube_url);
    setValue('duration', training.duration);
    setValue('category', training.category);
    setValue('required_for', JSON.parse(training.required_for));
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deletar treinamento?')) return;
    setTrainings(prev => prev.filter(t => t.id !== id));
    toast.success('Treinamento deletado!');
  };

  const handleCompleteTraining = (trainingId: string) => {
    setCompletedTrainings(prev => [...prev, trainingId]);
    toast.success('Treinamento marcado como concluído!');
  };

  const openCreateModal = () => {
    setEditingTraining(null);
    reset();
    setShowModal(true);
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treinamentos do Sistema</h1>
          <p className="text-gray-600">Aprenda a usar todas as funcionalidades do MetroSaaS</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Treinamento</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar treinamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todas categorias</option>
            <option value="Básico">Básico</option>
            <option value="Gestão">Gestão</option>
            <option value="Certificação">Certificação</option>
            <option value="Técnico">Técnico</option>
            <option value="Administração">Administração</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map((training) => {
          const videoId = getYouTubeVideoId(training.youtube_url);
          const isCompleted = completedTrainings.includes(training.id);
          
          return (
            <div key={training.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {videoId && (
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                    alt={training.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{training.title}</h3>
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{training.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    {training.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{training.duration} min</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <a
                    href={training.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>Assistir</span>
                  </a>
                  {!isCompleted && (
                    <button
                      onClick={() => handleCompleteTraining(training.id)}
                      className="px-3 py-2 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      Concluir
                    </button>
                  )}
                  <button onClick={() => handleEdit(training)} className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(training.id)} className="px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTrainings.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum treinamento encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter ? 'Ajuste sua pesquisa.' : 'Cadastre seu primeiro treinamento do sistema.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingTraining ? 'Editar Treinamento' : 'Novo Treinamento'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                  <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL do YouTube *</label>
                  <input {...register('youtube_url')} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {errors.youtube_url && <p className="mt-1 text-sm text-red-600">{errors.youtube_url.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duração (minutos) *</label>
                    <input type="number" {...register('duration', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                    <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione</option>
                      <option value="Básico">Básico</option>
                      <option value="Gestão">Gestão</option>
                      <option value="Certificação">Certificação</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Administração">Administração</option>
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Obrigatório para *</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" {...register('required_for')} value="admin" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Administradores</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" {...register('required_for')} value="tecnico" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Técnicos</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" {...register('required_for')} value="cliente" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Clientes</span>
                    </label>
                  </div>
                  {errors.required_for && <p className="mt-1 text-sm text-red-600">{errors.required_for.message}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingTraining(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingTraining ? 'Atualizar' : 'Criar'} Treinamento
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