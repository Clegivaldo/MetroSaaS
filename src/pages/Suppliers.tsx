import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, Edit, Trash2, MapPin, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { consultarCNPJ, formatarCNPJ, validarCNPJ } from '../utils/cnpjApi';

const supplierSchema = z.object({
  cnpj: z.string().optional().refine((val) => !val || validarCNPJ(val), 'CNPJ inválido'),
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  type: z.string().min(1, 'Tipo obrigatório'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  type: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultingCNPJ, setConsultingCNPJ] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const cnpjValue = watch('cnpj');

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, typeFilter, statusFilter]);

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:3001/api/suppliers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        toast.error('Erro ao carregar fornecedores');
      }
    } catch (error) {
      toast.error('Erro ao carregar fornecedores');
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

  const onSubmit = async (data: SupplierFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingSupplier ? `http://localhost:3001/api/suppliers/${editingSupplier.id}` : 'http://localhost:3001/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const formattedData = {
        ...data,
        cnpj: data.cnpj ? formatarCNPJ(data.cnpj) : undefined
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        toast.success(editingSupplier ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
        setShowModal(false);
        setEditingSupplier(null);
        reset();
        fetchSuppliers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar fornecedor');
      }
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setValue('cnpj', supplier.cnpj || '');
    setValue('name', supplier.name);
    setValue('email', supplier.email || '');
    setValue('phone', supplier.phone || '');
    setValue('address', supplier.address || '');
    setValue('city', supplier.city || '');
    setValue('state', supplier.state || '');
    setValue('zip_code', supplier.zip_code || '');
    setValue('type', supplier.type);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar fornecedor?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Fornecedor deletado!');
        fetchSuppliers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos tipos</option>
            <option value="padroes">Padrões</option>
            <option value="servicos">Serviços</option>
            <option value="equipamentos">Equipamentos</option>
            <option value="calibracao">Calibração</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Todos status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{supplier.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                supplier.status === 'ativo' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {supplier.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="space-y-2">
              {supplier.cnpj && (
                <div className="text-sm text-gray-600">
                  <strong>CNPJ:</strong> {supplier.cnpj}
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.city && supplier.state && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.city}, {supplier.state}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(supplier)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(supplier.id)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter || statusFilter ? 'Ajuste sua pesquisa.' : 'Cadastre seu primeiro fornecedor.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                    <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione</option>
                      <option value="padroes">Padrões</option>
                      <option value="servicos">Serviços</option>
                      <option value="equipamentos">Equipamentos</option>
                      <option value="calibracao">Calibração</option>
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" {...register('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <input {...register('zip_code')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingSupplier(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingSupplier ? 'Atualizar' : 'Criar'} Fornecedor
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