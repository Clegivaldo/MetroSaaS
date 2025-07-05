import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, Edit, Trash2, Download, Eye, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const documentSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  type: z.string().min(1, 'Tipo obrigatório'),
  version: z.string().min(1, 'Versão obrigatória'),
  category: z.string().optional(),
  file_url: z.string().optional(),
  approved_by: z.string().optional(),
  approval_date: z.string().optional(),
  review_date: z.string().optional(),
  next_review_date: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface Document {
  id: string;
  title: string;
  type: string;
  version: string;
  file_url?: string;
  status: 'ativo' | 'obsoleto' | 'em_revisao';
  approved_by?: string;
  approved_by_name?: string;
  approval_date?: string;
  review_date?: string;
  next_review_date?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'ativo':
      return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
    case 'obsoleto':
      return { label: 'Obsoleto', color: 'bg-red-100 text-red-800' };
    case 'em_revisao':
      return { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800' };
    default:
      return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
  }
};

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
  });

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
  }, [searchTerm, typeFilter, statusFilter]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:3001/api/documents?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        toast.error('Erro ao carregar documentos');
      }
    } catch (error) {
      toast.error('Erro ao carregar documentos');
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

  const onSubmit = async (data: DocumentFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingDocument ? `http://localhost:3001/api/documents/${editingDocument.id}` : 'http://localhost:3001/api/documents';
      const method = editingDocument ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingDocument ? 'Documento atualizado!' : 'Documento criado!');
        setShowModal(false);
        setEditingDocument(null);
        reset();
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar documento');
      }
    } catch (error) {
      toast.error('Erro ao salvar documento');
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setValue('title', document.title);
    setValue('type', document.type);
    setValue('version', document.version);
    setValue('category', document.category || '');
    setValue('file_url', document.file_url || '');
    setValue('approved_by', document.approved_by || '');
    setValue('approval_date', document.approval_date ? document.approval_date.split('T')[0] : '');
    setValue('review_date', document.review_date ? document.review_date.split('T')[0] : '');
    setValue('next_review_date', document.next_review_date ? document.next_review_date.split('T')[0] : '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar documento?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Documento deletado!');
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingDocument(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Documentos ISO 17025</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Documento</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos tipos</option>
            <option value="Procedimento">Procedimento</option>
            <option value="Instrução">Instrução</option>
            <option value="Manual">Manual</option>
            <option value="Política">Política</option>
            <option value="Formulário">Formulário</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos status</option>
            <option value="ativo">Ativo</option>
            <option value="em_revisao">Em Revisão</option>
            <option value="obsoleto">Obsoleto</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprovado por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Revisão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => {
                const statusInfo = getStatusInfo(document.status);
                
                return (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{document.title}</div>
                          <div className="text-sm text-gray-500">{document.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{document.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{document.version}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {document.approved_by_name || 'Não aprovado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {document.next_review_date ? new Date(document.next_review_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(document)} className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(document.id)} className="text-red-600 hover:text-red-900 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {document.file_url && (
                          <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900 transition-colors">
                            <Download className="w-4 h-4" />
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

      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter || statusFilter ? 'Ajuste sua pesquisa.' : 'Cadastre seu primeiro documento.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingDocument ? 'Editar Documento' : 'Novo Documento'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                    <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                    <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione</option>
                      <option value="Procedimento">Procedimento</option>
                      <option value="Instrução">Instrução</option>
                      <option value="Manual">Manual</option>
                      <option value="Política">Política</option>
                      <option value="Formulário">Formulário</option>
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Versão *</label>
                    <input {...register('version')} placeholder="Ex: 1.0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.version && <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <input {...register('category')} placeholder="Ex: Qualidade, Técnico" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL do Arquivo</label>
                    <input {...register('file_url')} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aprovado por</label>
                    <select {...register('approved_by')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione usuário</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Aprovação</label>
                    <input type="date" {...register('approval_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Revisão</label>
                    <input type="date" {...register('review_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Próxima Revisão</label>
                    <input type="date" {...register('next_review_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingDocument(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingDocument ? 'Atualizar' : 'Criar'} Documento
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