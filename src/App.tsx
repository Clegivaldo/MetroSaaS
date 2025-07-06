import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Certificates } from './pages/Certificates';
import { Standards } from './pages/Standards';
import { EquipmentTypes } from './pages/EquipmentTypes';
import { Appointments } from './pages/Appointments';
import { Documents } from './pages/Documents';
import { Suppliers } from './pages/Suppliers';
import { Trainings } from './pages/Trainings';
import { SystemTrainings } from './pages/SystemTrainings';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Activities } from './pages/Activities';
import { Notifications } from './pages/Notifications';
import { Maintenance } from './pages/Maintenance';
import { NonConformities } from './pages/NonConformities';
import { StandardTypes } from './pages/StandardTypes';
import { DocumentCategories } from './pages/DocumentCategories';
import { UserPermissions } from './pages/UserPermissions';
import { Users } from './pages/Users';
import { Grandezas } from './pages/Grandezas';
import { ClientEquipment } from './pages/ClientEquipment';
import { Calibrations } from './pages/Calibrations';
import { LayoutDesigner } from './pages/LayoutDesigner';
import { Backup } from './pages/Backup';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/certificados" element={<Certificates />} />
        <Route path="/padroes" element={<Standards />} />
        <Route path="/tipos-equipamentos" element={<EquipmentTypes />} />
        <Route path="/equipamentos-clientes" element={<ClientEquipment />} />
        <Route path="/agendamentos" element={<Appointments />} />
        <Route path="/calibracoes" element={<Calibrations />} />
        <Route path="/documentos" element={<Documents />} />
        <Route path="/categorias-documentos" element={<DocumentCategories />} />
        <Route path="/grandezas" element={<Grandezas />} />
        <Route path="/permissoes" element={<UserPermissions />} />
        <Route path="/users" element={<Users />} />
        <Route path="/fornecedores" element={<Suppliers />} />
        <Route path="/treinamentos" element={<Trainings />} />
        <Route path="/treinamentos-sistema" element={<SystemTrainings />} />
        <Route path="/manutencao" element={<Maintenance />} />
        <Route path="/nao-conformidades" element={<NonConformities />} />
        <Route path="/layout-designer" element={<LayoutDesigner />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/atividades" element={<Activities />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;