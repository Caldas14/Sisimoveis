// Tipos relacionados a usuários e autenticação

export type Cargo = 'Administrador' | 'Usuário';

export interface Usuario {
  id: string;
  nome: string;
  nomeUsuario: string;
  cargoId: string | number; // Aceita tanto string (UUID) quanto number
  cargo?: Cargo; // Mantido para compatibilidade, mas agora opcional
  ativo: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
  ultimoLogin?: string | null;
}

export interface UsuarioFormData {
  nome: string;
  nomeUsuario: string;
  senha: string;
  cargo: Cargo;
  ativo: boolean;
}

export interface LoginCredentials {
  nomeUsuario: string;
  senha: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}

export interface UsuarioState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
