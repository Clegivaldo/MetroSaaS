import React, { useState, useEffect } from 'react';
import { Plus, Search, Award, Calendar, AlertTriangle, CheckCircle, Edit, Trash2, Upload, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const certificateSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  equipment_id: z.string().min(1, 'Equipamento obrigatório'),
  certificate_number: z.string().min(1, 'Número certificado obrigatório'),
  calibration_date: z.string().min(1, 'Data calibração obrigatória'),
  expiration_date: z.string().min(1, 'Data vencimento obrigatória'),
  observations: z.string().optional(),
});

type CertificateFormData = z.infer<typeof certificateSchema>;

interface Certificate {
  id: string;
  client_id: string;
  client_name: string;
  equipment_id: string;
  equipment_name: string;
  certificate_number: string;
  calibration_date: string;
  expiration_date: string;
  status: 'valido' | 'vencido' | 'prestes_vencer';
  observations?: string;
  pdf_path?: string;
  technician_name?: string;
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

export function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientEquipments, setClientEquipments] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
  });

  const watchedClientId = watch('client_id');

  useEffect(() => {
    fetchCertificates();
    fetchClients();
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (watchedClientId) {
      fetchClientEquipments(watchedClientId);
    } else {
      setClientEquipments([]);
    }
  }, [watchedClientId]);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:3001/api/certificates?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      } else {
        toast.error('Erro ao carregar certificados');
      }
    } catch (error) {
      toast.error('Erro ao carregar certificados');
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

  const fetchClientEquipments = async (clientId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/certificates/client-equipment/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClientEquipments(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos do cliente');
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:3001/api/upload/certificates', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Erro no upload');
    return await response.json();
  };

  const onSubmit = async (data: CertificateFormData) => {
    try {
      setUploading(true);
      let pdf_path = '';

      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        pdf_path = uploadResult.path;
      }

      const token = localStorage.getItem('auth_token');
      const url = editingCertificate ? `http://localhost:3001/api/certificates/${editingCertificate.id}` : 'http://localhost:3001/api/certificates';
      const method = editingCertificate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, pdf_path }),
      });

      if (response.ok) {
        toast.success(editingCertificate ? 'Certificado atualizado!' : 'Certificado criado!');
        setShowModal(false);
        setEditingCertificate(null);
        setSelectedFile(null);
        reset();
        fetchCertificates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar certificado');
      }
    } catch (error) {
      toast.error('Erro ao salvar certificado');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setValue('client_id', certificate.client_id);
    setValue('equipment_id', certificate.equipment_id);
    setValue('certificate_number', certificate.certificate_number);
    setValue('calibration_date', certificate.calibration_date.split('T')[0]);
    setValue('expiration_date', certificate.expiration_date.split('T')[0]);
    setValue('observations', certificate.observations || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar certificado?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Certificado deletado!');
        fetchCertificates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const openCreateModal = () => {
    setEditingCertificate(null);
    setSelectedFile(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Certificados de Calibração</h1>
        <button onClick={openCreateModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo Certificado</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, equipamento ou número..."
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
            <option value="valido">Válido</option>
            <option value="prestes_vencer">Prestes a Vencer</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número Certificado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Calibração</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certificates.map((certificate) => {
                const statusInfo = getStatusInfo(certificate.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={certificate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{certificate.client_name}</div>
                          <div className="text-sm text-gray-500">{certificate.equipment_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{certificate.certificate_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(certificate.calibration_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(certificate.expiration_date).toLocaleDateString('pt-BR')}
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
                        <button onClick={() => handleEdit(certificate)} className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(certificate.id)} className="text-red-600 hover:text-red-900 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {certificate.pdf_path && (
                          <a href={`http://localhost:3001${certificate.pdf_path}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900 transition-colors">
                            <FileText className="w-4 h-4" />
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

      {certificates.length === 0 && (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum certificado encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter ? 'Tente ajustar sua pesquisa.' : 'Comece emitindo seu primeiro certificado.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingCertificate ? 'Editar Certificado' : 'Novo Certificado'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                    <select {...register('client_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipamento *</label>
                    <select {...register('equipment_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Selecione equipamento</option>
                      {clientEquipments.map(equipment => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.identificacao || equipment.serial_number || 'N/A'}
                        </option>
                      ))}
                    </select>
                    {errors.equipment_id && <p className="mt-1 text-sm text-red-600">{errors.equipment_id.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número do Certificado *</label>
                    <input {...register('certificate_number')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.certificate_number && <p className="mt-1 text-sm text-red-600">{errors.certificate_number.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Calibração *</label>
                    <input type="date" {...register('calibration_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.calibration_date && <p className="mt-1 text-sm text-red-600">{errors.calibration_date.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento *</label>
                    <input type="date" {...register('expiration_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    {errors.expiration_date && <p className="mt-1 text-sm text-red-600">{errors.expiration_date.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                    <textarea {...register('observations')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo do Certificado</label>
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingCertificate(null); setSelectedFile(null); reset(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={uploading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {uploading ? 'Salvando...' : editingCertificate ? 'Atualizar' : 'Criar'} Certificado
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