import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Play, Clock, Edit, Trash2, CheckCircle, User } from 'lucide-react';
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

interface Training {
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

interface TrainingParticipation {
  id: string;
  user_id: string;
  training_id: string;
  completed_at?: string;
  score?: number;
  status: 'em_andamento' | 'concluido' | 'reprovado';
  title: string;
  category: string;
  duration: number;
}

export function Trainings() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [participations, setParticipations] = useState<TrainingParticipation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
  });

  useEffect(() => {
    fetchTrainings();
    fetchParticipations();
  }, [searchTerm, categoryFilter]);

  const fetchTrainings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`http://localhost:3001/api/trainings?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTrainings(data);
      } else {
        toast.error('Erro ao carregar treinamentos');
      }
    } catch (error) {
      toast.error('Erro ao carregar treinamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/trainings/user/participations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setParticipations(data);
      }
    } catch (error) {
      console.error('Erro ao carregar participações');
    }
  };

  const onSubmit = async (data: TrainingFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingTraining ? `http://localhost:3001/api/trainings/${editingTraining.id}` : 'http://localhost:3001/api/trainings';
      const method = editingTraining ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingTraining ? 'Treinamento atualizado!' : 'Treinamento criado!');
        setShowModal(false);
        setEditingTraining(null);
        reset();
        fetchTrainings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar treinamento');
      }
    } catch (error) {
      toast.error('Erro ao salvar treinamento');
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setValue('title', training.title);
    setValue('description', training.description || '');
    setValue('youtube_url', training.youtube_url);
    setValue('duration', training.duration);
    setValue('category', training.category);
    setValue('required_for', JSON.parse(training.required_for));
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar treinamento?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/trainings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Treinamento deletado!');
        fetchTrainings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const handleCompleteTraining = async (trainingId: string, score: number = 100) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/trainings/${trainingId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score }),
      });

      if (response.ok) {
        toast.success('Treinamento marcado como concluído!');
        fetchParticipations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao completar treinamento');
      }
    } catch (error) {
      toast.error('Erro ao completar treinamento');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Treinamentos ISO 17025</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Treinamento</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Treinamentos Disponíveis
            </button>
            <button
              onClick={() => setActiveTab('my-trainings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-trainings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Meus Treinamentos
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
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
              <option value="Qualidade">Qualidade</option>
              <option value="Técnico">Técnico</option>
              <option value="Segurança">Segurança</option>
              <option value="Gestão">Gestão</option>
            </select>
          </div>

          {activeTab === 'available' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training) => {
                const videoId = getYouTubeVideoId(training.youtube_url);
                const isCompleted = participations.some(p => p.training_id === training.id && p.status === 'concluido');
                
                return (
                  <div key={training.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {videoId && (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                          alt={training.title}
                          className="w-full h-full object-cover"
                        />
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
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
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
          )}

          {activeTab === 'my-trainings' && (
            <div className="space-y-4">
              {participations.map((participation) => (
                <div key={participation.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{participation.title}</h3>
                        <p className="text-sm text-gray-500">{participation.category} • {participation.duration} min</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {participation.status === 'concluido' && (
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Concluído</span>
                          </div>
                          {participation.completed_at && (
                            <p className="text-xs text-gray-500">
                              {new Date(participation.completed_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {participation.score && (
                            <p className="text-xs text-gray-500">Nota: {participation.score}</p>
                          )}
                        </div>
                      )}
                      
                      {participation.status === 'em_andamento' && (
                        <span className="text-sm text-yellow-600 font-medium">Em Andamento</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {participations.length === 0 && (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum treinamento iniciado</h3>
                  <p className="mt-1 text-sm text-gray-500">Comece assistindo aos treinamentos disponíveis.</p>
                </div>
              )}
            </div>
          )}

          {trainings.length === 0 && activeTab === 'available' && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum treinamento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || categoryFilter ? 'Ajuste sua pesquisa.' : 'Cadastre seu primeiro treinamento.'}
              </p>
            </div>
          )}
        </div>
      </div>

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
                      <option value="Qualidade">Qualidade</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Segurança">Segurança</option>
                      <option value="Gestão">Gestão</option>
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