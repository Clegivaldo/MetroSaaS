import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Calendar, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupFile {
  name: string;
  size: number;
  created: string;
}

export function Backup() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/backup/list', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar backups');
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/backup/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Backup criado: ${data.filename}`);
        fetchBackups();
      }
    } catch (error) {
      toast.error('Erro ao criar backup');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm('Tem certeza? Esta ação irá sobrescrever todos os dados atuais.')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/backup/restore/${filename}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Backup restaurado com sucesso!');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      toast.error('Erro ao restaurar backup');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Backup e Restauração</h1>
        <button
          onClick={createBackup}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>Criar Backup</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Backup Manual</h3>
              <p className="text-sm text-gray-500">Criar backup completo agora</p>
            </div>
          </div>
          <button
            onClick={createBackup}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Backup'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Backup Automático</h3>
              <p className="text-sm text-gray-500">Configurar backup automático</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="ml-2 text-sm">Backup diário às 02:00</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded" />
              <span className="ml-2 text-sm">Manter 30 backups</span>
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Espaço em Disco</h3>
              <p className="text-sm text-gray-500">Uso atual do sistema</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Banco de dados</span>
              <span>2.5 MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Arquivos</span>
              <span>45.2 MB</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>47.7 MB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Backups Disponíveis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome do Arquivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Criação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{backup.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(backup.size)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(backup.created).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => restoreBackup(backup.name)}
                        disabled={loading}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Restaurar</span>
                      </button>
                      <a
                        href={`http://localhost:3001/api/backup/download/${backup.name}`}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-900"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {backups.length === 0 && (
          <div className="text-center py-8">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum backup encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Crie seu primeiro backup para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}