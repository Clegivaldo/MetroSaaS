export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'tecnico' | 'cliente';
  status: 'ativo' | 'inativo';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  clientId: string;
  equipmentName: string;
  serialNumber: string;
  calibrationDate: string;
  expirationDate: string;
  status: 'valido' | 'vencido' | 'prestes_vencer';
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Standard {
  id: string;
  name: string;
  serialNumber: string;
  type: string;
  calibrationDate: string;
  expirationDate: string;
  status: 'valido' | 'vencido' | 'prestes_vencer';
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  duration: number;
  category: string;
  requiredFor: ('admin' | 'tecnico' | 'cliente')[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}