import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  FileText, 
  Users, 
  Shield, 
  TestTube,
  Database,
  Save,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Settings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  laboratory_name: string;
  laboratory_cnpj: string;
  laboratory_address: string;
  iso17025_accreditation: string;
}

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  content: string;
  variables: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login?: string;
  created_at: string;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('smtp');
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register: registerSettings, handleSubmit: handleSubmitSettings, setValue: setValueSettings } = useForm<Settings>();
  const { register: registerTemplate, handleSubmit: handleSubmitTemplate, reset: resetTemplate, setValue: setValueTemplate } = useForm();
  const { register: registerUser, handleSubmit: handleSubmitUser, reset: resetUser, setValue: setValueUser } = useForm();

  const tabs = [
    { id: 'smtp', name: 'Configuração SMTP', icon: Mail },
    { id: 'templates', name: 'Templates', icon: FileText },
    { id: 'users', name: 'Usuários', icon: Users },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'lab', name: 'Laboratório', icon: TestTube },
    { id: 'system', name: 'Sistema', icon: Database },
  ];

  useEffect(() => {
    if (activeTab === 'smtp' || activeTab === 'lab') {
      fetchSettings();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        Object.keys(data).forEach(key => {
          setValueSettings(key as keyof Settings, data[key]);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações');
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates');
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

  const onSubmitSettings = async (data: Settings) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Configurações salvas!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testSMTP = async () => {
    const email = prompt('Digite um email para teste:');
    if (!email) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/settings/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success('Email de teste enviado!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro ao testar SMTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setValueTemplate('template_key', template.template_key);
    setValueTemplate('name', template.name);
    setValueTemplate('subject', template.subject);
    setValueTemplate('content', template.content);
    setShowTemplateModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setValueUser('name', user.name);
    setValueUser('email', user.email);
    setValueUser('role', user.role);
    setValueUser('status', user.status);
    setShowUserModal(true);
  };

  const onSubmitTemplate = async (data: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingTemplate ? `http://localhost:3001/api/templates/${editingTemplate.id}` : 'http://localhost:3001/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        resetTemplate();
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar template');
      }
    } catch (error) {
      toast.error('Erro ao salvar template');
    }
  };

  const onSubmitUser = async (data: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingUser ? `http://localhost:3001/api/users/${editingUser.id}` : 'http://localhost:3001/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingUser ? 'Usuário atualizado!' : 'Usuário criado!');
        setShowUserModal(false);
        setEditingUser(null);
        resetUser();
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar usuário');
      }
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Deletar template?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Template deletado!');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Erro ao deletar template');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Deletar usuário?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Usuário deletado!');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Erro ao deletar usuário');
    }
  };

  const resetUserPassword = async (id: string) => {
    if (!confirm('Resetar senha do usuário?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Nova senha enviada por email!');
      }
    } catch (error) {
      toast.error('Erro ao resetar senha');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'smtp' && (
            <form onSubmit={handleSubmitSettings(onSubmitSettings)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuração do Servidor SMTP</h3>
                <p className="text-sm text-gray-600 mb-6">Configure os parâmetros para envio de emails automáticos do sistema.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Servidor SMTP</label>
                  <input {...registerSettings('smtp_host')} placeholder="smtp.gmail.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Porta</label>
                  <input {...registerSettings('smtp_port')} placeholder="587" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email do Remetente</label>
                  <input type="email" {...registerSettings('smtp_from_email')} placeholder="sistema@seulaboratorio.com.br" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Remetente</label>
                  <input {...registerSettings('smtp_from_name')} placeholder="Sistema MetroSaaS" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
                  <input {...registerSettings('smtp_user')} placeholder="seu_usuario" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                  <input type="password" {...registerSettings('smtp_password')} placeholder="••••••••" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button type="button" onClick={testSMTP} disabled={loading} className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" />
                  <span>Testar Conexão</span>
                </button>
                <button type="submit" disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Templates de Email</h3>
                  <p className="text-sm text-gray-600">Personalize os templates utilizados pelo sistema para comunicação.</p>
                </div>
                <button onClick={() => { setEditingTemplate(null); resetTemplate(); setShowTemplateModal(true); }} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Novo Template</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.template_key}</p>
                        <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditTemplate(template)} className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTemplate(template.id)} className="text-red-600 hover:text-red-900 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gerenciar Usuários</h3>
                  <p className="text-sm text-gray-600">Controle de acesso e permissões do sistema.</p>
                </div>
                <button onClick={() => { setEditingUser(null); resetUser(); setShowUserModal(true); }} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Novo Usuário</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-900 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => resetUserPassword(user.id)} className="text-yellow-600 hover:text-yellow-900 transition-colors" title="Resetar senha">
                              <Shield className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lab' && (
            <form onSubmit={handleSubmitSettings(onSubmitSettings)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Laboratório</h3>
                <p className="text-sm text-gray-600 mb-6">Configure as informações básicas do seu laboratório conforme ISO 17025.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Laboratório</label>
                  <input {...registerSettings('laboratory_name')} placeholder="Laboratório de Metrologia XYZ" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                  <input {...registerSettings('laboratory_cnpj')} placeholder="00.000.000/0001-00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço Completo</label>
                  <textarea {...registerSettings('laboratory_address')} rows={3} placeholder="Rua, número, bairro, cidade, estado, CEP" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acreditação ISO 17025</label>
                  <input {...registerSettings('iso17025_accreditation')} placeholder="Número da acreditação" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  <span>Salvar Informações</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Segurança</h3>
                <p className="text-sm text-gray-600 mb-6">Controle as políticas de segurança do sistema.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Política de Senhas</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Exigir pelo menos 8 caracteres</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Exigir letras maiúsculas e minúsculas</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Exigir números</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Exigir caracteres especiais</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Controle de Acesso</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Máximo de tentativas de login</span>
                      <input type="number" defaultValue={3} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Tempo de bloqueio (minutos)</span>
                      <input type="number" defaultValue={15} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                    </div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Logout automático após inatividade</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações do Sistema</h3>
                <p className="text-sm text-gray-600 mb-6">Configurações gerais e manutenção do sistema.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Backup Automático</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Ativar backup automático</span>
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Frequência</span>
                      <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                        <option>Diário</option>
                        <option>Semanal</option>
                        <option>Mensal</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Logs do Sistema</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Retenção de logs (dias)</span>
                      <input type="number" defaultValue={90} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                    </div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Log de auditoria detalhado</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h2>

              <form onSubmit={handleSubmitTemplate(onSubmitTemplate)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chave do Template</label>
                    <input {...registerTemplate('template_key')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input {...registerTemplate('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
                  <input {...registerTemplate('subject')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo HTML</label>
                  <textarea {...registerTemplate('content')} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); resetTemplate(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingTemplate ? 'Atualizar' : 'Criar'} Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>

              <form onSubmit={handleSubmitUser(onSubmitUser)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input {...registerUser('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" {...registerUser('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
                  <select {...registerUser('role')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Selecione</option>
                    <option value="admin">Administrador</option>
                    <option value="tecnico">Técnico</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>

                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select {...registerUser('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); resetUser(); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {editingUser ? 'Atualizar' : 'Criar'} Usuário
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