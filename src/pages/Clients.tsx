import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, Edit, Trash2, Eye, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { consultarCNPJ, formatarCNPJ, validarCNPJ } from '../utils/cnpjApi';

const clientSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ obrigatório').refine(validarCNPJ, 'CNPJ inválido'),
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultingCNPJ, setConsultingCNPJ] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const cnpjValue = watch('cnpj');

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:3001/api/clients?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        toast.error('Erro ao carregar clientes');
      }
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCNPJConsult = async () => {
    if (!cnpjValue || !validarCNPJ(cnpjValue)) {
      toast.error('Digite um CNPJ válido');
      return;
    }

    setConsultingCNPJ(true);
    try {
      const data = await consultarCNPJ(cnpjValue);
      
      // Preenche os campos automaticamente
      setValue('name', data.nome || data.razaoSocial);
      setValue('email', data.email || '');
      setValue('phone', data.telefone || '');
      setValue('address', data.endereco ? `${data.endereco}, ${data.numero || 'S/N'}` : '');
      setValue('city', data.cidade || '');
      setValue('state', data.estado || '');
      setValue('zip_code', data.cep || '');
      
      toast.success('Dados preenchidos automaticamente!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao consultar CNPJ');
    } finally {
      setConsultingCNPJ(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingClient ? `http://localhost:3001/api/clients/${editingClient.id}` : 'http://localhost:3001/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...data,
          cnpj: formatarCNPJ(data.cnpj)
        }),
      });

      if (response.ok) {
        toast.success(editingClient ? 'Cliente atualizado!' : 'Cliente criado!');
        setShowModal(false);
        setEditingClient(null);
        reset();
        fetchClients();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setValue('cnpj', client.cnpj);
    setValue('name', client.name);
    setValue('email', client.email);
    setValue('phone', client.phone || '');
    setValue('address', client.address || '');
    setValue('city', client.city || '');
    setValue('state', client.state || '');
    setValue('zip_code', client.zip_code || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar cliente?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Cliente deletado!');
        fetchClients();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingClient(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.cnpj}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                client.status === 'ativo' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.city && client.state && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{client.city}, {client.state}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(client)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(client.id)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter ? 'Tente ajustar sua pesquisa.' : 'Comece cadastrando seu primeiro cliente.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ *</label>
                    <div className="flex space-x-2">
                      <input 
                        {...register('cnpj')} 
                        placeholder="00.000.000/0000-00"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      <button
                        type="button"
                        onClick={handleCNPJConsult}
                        disabled={consultingCNPJ || !cnpjValue}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {consultingCNPJ ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        <span>Consultar</span>
                      </button>
                    </div>
                    {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" {...register('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                    <input {...register('address')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input {...register('city')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <input {...register('state')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <input {...register('zip_code')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingClient(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingClient ? 'Atualizar' : 'Criar'} Cliente
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