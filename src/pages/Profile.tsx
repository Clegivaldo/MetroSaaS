import React, { useState, useEffect } from 'react';
import { User, Camera, Save, Eye, EyeOff, Calendar, Clock, Shield, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login?: string;
  created_at: string;
  profile_image?: string;
}

export function Profile() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, setValue: setProfileValue } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/users/${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setProfileValue('name', data.name);
        setProfileValue('email', data.email);
      } else {
        toast.error('Erro ao carregar perfil');
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!');
        fetchUserProfile();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3001/api/users/${user?.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Senha alterada com sucesso!');
        setShowPasswordForm(false);
        resetPassword();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      toast.error('Erro ao alterar senha');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simular upload de imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUserProfile(prev => prev ? { ...prev, profile_image: imageUrl } : null);
        toast.success('Imagem de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'tecnico': return 'Técnico';
      case 'cliente': return 'Cliente';
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar perfil</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {userProfile.profile_image ? (
                  <img src={userProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900">{userProfile.name}</h2>
            <p className="text-gray-600">{userProfile.email}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">{getRoleLabel(userProfile.role)}</span>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${userProfile.status === 'ativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">{getStatusLabel(userProfile.status)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
            
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input {...registerProfile('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {profileErrors.name && <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" {...registerProfile('email')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  {profileErrors.email && <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Conta</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data de Criação</p>
                    <p className="text-sm text-gray-600">
                      {new Date(userProfile.created_at).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Último Login</p>
                    <p className="text-sm text-gray-600">
                      {userProfile.last_login 
                        ? new Date(userProfile.last_login).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nível de Acesso</p>
                    <p className="text-sm text-gray-600">{getRoleLabel(userProfile.role)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Verificado</p>
                    <p className="text-sm text-green-600">Verificado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configurações de Segurança</h3>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                {showPasswordForm ? 'Cancelar' : 'Alterar Senha'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...registerPassword('currentPassword')}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha *</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        {...registerPassword('newPassword')}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerPassword('confirmPassword')}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      resetPassword();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Save className="w-4 h-4" />
                    <span>Alterar Senha</span>
                  </button>
                </div>
              </form>
            )}

            {!showPasswordForm && (
              <div className="text-sm text-gray-600">
                <p>• Use uma senha forte com pelo menos 8 caracteres</p>
                <p>• Inclua letras maiúsculas, minúsculas e números</p>
                <p>• Evite usar informações pessoais</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}