import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronDown,
  AlertTriangle,
  Folder,
  Shield,
  Database,
  BarChart3,
  Cog,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

export function Sidebar() {
  const { logout, user } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['dashboard']);

  const menuCategories: MenuCategory[] = [
    {
      name: 'Dashboard',
      icon: Home,
      items: [
        { name: 'Dashboard', href: '/', icon: Home },
      ]
    },
    {
      name: 'Gestão',
      icon: Database,
      items: [
        { name: 'Clientes', href: '/clientes', icon: Users },
        { name: 'Fornecedores', href: '/fornecedores', icon: Building2 },
        { name: 'Usuários', href: '/users', icon: User },
        { name: 'Permissões', href: '/permissoes', icon: Shield },
      ]
    },
    {
      name: 'Documentação',
      icon: FileText,
      items: [
        { name: 'Documentos', href: '/documentos', icon: FileText },
        { name: 'Categorias de Documentos', href: '/categorias-documentos', icon: Folder },
        { name: 'Padrões', href: '/padroes', icon: Wrench },
        { name: 'Tipos de Equipamentos', href: '/tipos-equipamentos', icon: ClipboardList },
        { name: 'Grandezas', href: '/grandezas', icon: BarChart3 },
        { name: 'Equipamentos de Clientes', href: '/equipamentos-clientes', icon: User },
      ]
    },
    {
      name: 'Certificação',
      icon: Award,
      items: [
        { name: 'Certificados', href: '/certificados', icon: Award },
        { name: 'Agendamentos', href: '/agendamentos', icon: Calendar },
      ]
    },
    {
      name: 'Qualidade',
      icon: Cog,
      items: [
        { name: 'Não Conformidades', href: '/nao-conformidades', icon: AlertTriangle },
        { name: 'Treinamentos ISO', href: '/treinamentos', icon: BookOpen },
        { name: 'Treinamentos Sistema', href: '/treinamentos-sistema', icon: BookOpen },
      ]
    },
    {
      name: 'Relatórios',
      icon: BarChart3,
      items: [
        { name: 'Logs do Sistema', href: '/atividades', icon: Monitor },
      ]
    },
    {
      name: 'Configurações',
      icon: Settings,
      items: [
        { name: 'Configurações', href: '/configuracoes', icon: Settings },
      ]
    }
  ];

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">MetroSaaS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.name);
          const CategoryIcon = category.icon;

          // Se for Dashboard, renderizar como item simples
          if (category.name === 'Dashboard') {
            return (
              <div key={category.name} className="space-y-1">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <CategoryIcon className="w-4 h-4" />
                  <span>{category.name}</span>
                </NavLink>
              </div>
            );
          }

          return (
            <div key={category.name} className="space-y-1">
              <button
                onClick={() => toggleCategory(category.name)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CategoryIcon className="w-4 h-4" />
                  <span>{category.name}</span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {category.items.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <NavLink
          to="/perfil"
          className="flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'email@exemplo.com'}
            </p>
          </div>
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}