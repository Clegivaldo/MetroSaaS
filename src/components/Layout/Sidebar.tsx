import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  Calendar,
  Award,
  Settings,
  BookOpen,
  Building2,
  Wrench,
  LogOut,
  Monitor,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Certificados', href: '/certificados', icon: Award },
  { name: 'Padrões', href: '/padroes', icon: Wrench },
  { name: 'Agendamentos', href: '/agendamentos', icon: Calendar },
  { name: 'Documentos', href: '/documentos', icon: FileText },
  { name: 'Fornecedores', href: '/fornecedores', icon: Building2 },
  { name: 'Treinamentos ISO', href: '/treinamentos', icon: BookOpen },
  { name: 'Treinamentos Sistema', href: '/treinamentos-sistema', icon: Monitor },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleProfileClick = () => {
    navigate('/perfil');
    setShowUserMenu(false);
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg h-full">
      <div className="flex items-center justify-center h-20 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">MetroSaaS</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'tecnico' ? 'Técnico' : 'Cliente'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              <button
                onClick={handleProfileClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 mr-3" />
                Meu Perfil
              </button>
              <hr className="my-1" />
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}