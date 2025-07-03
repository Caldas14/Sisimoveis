import { Usuario, UsuarioFormData, LoginCredentials, LoginResponse, Cargo } from '../types/usuario';
import { fetchApi } from '../services/apiService';

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Configurações do serviço

// Variáveis para controlar o comportamento do serviço
let useMockData = false; // Controla se devemos usar dados mockados em vez da API

// Credenciais mestras para acesso de emergência quando o backend estiver indisponível
const MASTER_CREDENTIALS = {
  nomeUsuario: 'Admin',
  senha: 'admcehop'
};

// Função para fazer login
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  // Verificar se são as credenciais mestras
  if (credentials.nomeUsuario === MASTER_CREDENTIALS.nomeUsuario && 
      credentials.senha === MASTER_CREDENTIALS.senha) {
    console.log('Usando credenciais mestras para acesso de emergência');
    
    // Criar um token fictício para autenticação offline
    const masterToken = 'master_emergency_access_token';
    
    // Criar dados de usuário administrador para acesso offline
    // Verificar se já existe uma preferência de tema salva no localStorage
    let preferenciaTema: boolean | null = null;
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if ('preferenciaModoEscuro' in userData) {
          preferenciaTema = userData.preferenciaModoEscuro;
        }
      }
    } catch (err) {
      console.error('Erro ao obter preferência de tema:', err);
    }
    
    const masterUser: Usuario = {
      id: 'master_admin',
      nome: 'Administrador Mestre',
      nomeUsuario: 'Admin',
      cargoId: 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF',
      cargo: 'Administrador',
      ativo: true,
      preferenciaModoEscuro: preferenciaTema
    };
    
    // Salvar no localStorage
    localStorage.setItem('authToken', masterToken);
    localStorage.setItem('userData', JSON.stringify(masterUser));
    localStorage.setItem('usingMasterCredentials', 'true');
    
    // Retornar resposta simulando uma resposta do servidor
    return {
      success: true,
      token: masterToken,
      usuario: masterUser,
      message: 'Login com credenciais mestras realizado com sucesso'
    } as LoginResponse;
  }
  
  try {
    const response = await fetchApi('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // Salvar token e dados do usuário no localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    if (response.usuario) {
      localStorage.setItem('userData', JSON.stringify(response.usuario));
      localStorage.removeItem('usingMasterCredentials'); // Remover flag de credenciais mestras
    }
    
    return response;
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    
    // Verificar novamente as credenciais mestras como fallback
    // Isso permite que as credenciais mestras funcionem mesmo se o usuário tentar fazer login normal
    // e o backend estiver indisponível
    if (credentials.nomeUsuario === MASTER_CREDENTIALS.nomeUsuario && 
        credentials.senha === MASTER_CREDENTIALS.senha) {
      return login(credentials); // Chamar recursivamente para usar o caminho das credenciais mestras
    }
    
    // Erro de login, não há fallback para login
    throw new Error('Falha na autenticação');
  }
}

// Função para fazer logout
export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('usingMasterCredentials');
}

// Função para verificar se o usuário está autenticado
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

// Função para verificar se está usando credenciais mestras
export function isUsingMasterCredentials(): boolean {
  return localStorage.getItem('usingMasterCredentials') === 'true';
}

// Função para verificar se o usuário é administrador
export function isAdmin(): boolean {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      console.log('isAdmin: Nenhum dado de usuário encontrado');
      return false;
    }
    
    const userData = JSON.parse(userDataStr);
    console.log('isAdmin: Dados do usuário:', userData);
    console.log('isAdmin: CargoId do usuário:', userData.cargoId);
    
    // Verificar se o cargoId corresponde ao cargo de Administrador
    // No banco de dados, o cargo Administrador pode ser identificado por:
    // - Um número (1)
    // - Um UUID específico ('F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF')
    const adminCargoId = 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF';
    
    const isAdminUser = 
      userData.cargoId === 1 || 
      userData.cargoId === '1' || 
      userData.cargoId === adminCargoId ||
      (userData.cargo && userData.cargo === 'Administrador');
    
    console.log('isAdmin: É administrador?', isAdminUser);
    return isAdminUser;
  } catch (err) {
    console.error('Erro ao verificar se o usuário é administrador:', err);
    return false;
  }
}

// Função para obter o token de autenticação
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Função para obter os dados do usuário logado
export function getCurrentUser(): { id: string; nome: string; nomeUsuario: string; cargoId: string | number; preferenciaModoEscuro?: boolean | null; } | null {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    
    const userData = JSON.parse(userDataStr);
    return userData;
  } catch (err) {
    console.error('Erro ao obter dados do usuário:', err);
    return null;
  }
}

// Função para verificar se o token ainda é válido no backend
export async function verificarToken(): Promise<boolean> {
  try {
    // Verificar primeiro se está usando credenciais mestras
    if (isUsingMasterCredentials()) {
      console.log('Usando credenciais mestras, token considerado válido sem verificação no backend');
      return true; // Token mestre é sempre válido
    }

    const token = getAuthToken();
    if (!token) {
      return false;
    }

    // Chamar endpoint de verificação de token
    const response = await fetchApi('/usuarios/verificar-token', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.valid === true;
  } catch (err) {
    console.error('Erro ao verificar token:', err);
    
    // Se houver erro na verificação, verificar se são as credenciais mestras
    if (isUsingMasterCredentials()) {
      console.log('Erro na verificação do token, mas usando credenciais mestras, token considerado válido');
      return true;
    }
    
    // Se não são credenciais mestras, consideramos o token inválido
    return false;
  }
}

// Função para verificar a sessão localmente (fallback quando o backend não está disponível)
export function verificarSessaoLocal(): boolean {
  // Verificar primeiro se está usando credenciais mestras
  if (isUsingMasterCredentials()) {
    console.log('Usando credenciais mestras, sessão local considerada válida');
    return true; // Sessão mestra é sempre válida localmente
  }
  
  const token = getAuthToken();
  const userData = getCurrentUser();
  
  return !!token && !!userData;
}

// Função para listar todos os usuários (apenas admin)
export async function listarUsuarios(): Promise<Usuario[]> {
  // Verificar se está usando credenciais mestras
  if (isUsingMasterCredentials()) {
    console.log('Usando credenciais mestras para listar usuários');
    
    // Quando estiver usando credenciais mestras, retornar apenas o usuário administrador mestre
    // Isso evita tentar acessar o backend quando ele estiver indisponível
    const masterUser: Usuario = {
      id: 'master_admin',
      nome: 'Administrador Mestre',
      nomeUsuario: 'Admin',
      cargoId: 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF',
      cargo: 'Administrador',
      ativo: true,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      ultimoLogin: new Date().toISOString()
    };
    
    return [masterUser];
  }
  
  try {
    const response = await fetchApi('/usuarios', {
      method: 'GET',
      headers: {
        'x-auth-token': getAuthToken() || ''
      }
    });
    
    return response;
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    
    // Verificar novamente se são credenciais mestras como fallback
    if (isUsingMasterCredentials()) {
      return listarUsuarios(); // Chamar recursivamente para usar o caminho das credenciais mestras
    }
    
    // Não usar dados mockados, lançar o erro para tratamento adequado
    throw err;
  }
}

// Função para buscar usuário por ID
export async function buscarUsuarioPorId(id: string): Promise<Usuario> {
  try {
    const response = await fetchApi(`/usuarios/${id}`, {
      method: 'GET',
      headers: {
        'x-auth-token': getAuthToken() || ''
      }
    });
    
    return response;
  } catch (err) {
    console.error(`Erro ao buscar usuário com ID ${id}:`, err);
    
    if (useMockData) {
      // Mock de resposta para desenvolvimento
      if (id === '1') {
        return {
          id: '1',
          nome: 'Administrador',
          nomeUsuario: 'admin',
          cargoId: 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF',
          cargo: 'Administrador',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ultimoLogin: new Date().toISOString()
        };
      } else {
        return {
          id: '2',
          nome: 'Usuário Teste',
          nomeUsuario: 'usuario',
          cargoId: '8D7C5F3A-9B2E-4D1F-8E6A-7C9D3F2B1A0E',
          cargo: 'Usuário',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ultimoLogin: null
        };
      }
    }
    
    throw err;
  }
}

// Função para cadastrar novo usuário
export async function cadastrarUsuario(usuario: UsuarioFormData): Promise<Usuario> {
  try {
    const response = await fetchApi('/usuarios', {
      method: 'POST',
      headers: {
        'x-auth-token': getAuthToken() || ''
      },
      body: JSON.stringify(usuario)
    });
    
    return response;
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    
    if (useMockData) {
      // Mock de resposta para desenvolvimento
      return {
        id: Math.random().toString(36).substring(2, 9),
        nome: usuario.nome,
        nomeUsuario: usuario.nomeUsuario,
        cargoId: usuario.cargo === 'Administrador' ? 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF' : '8D7C5F3A-9B2E-4D1F-8E6A-7C9D3F2B1A0E',
        cargo: usuario.cargo,
        ativo: usuario.ativo,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        ultimoLogin: null
      };
    }
    
    throw err;
  }
}

// Função para atualizar usuário
export async function atualizarUsuario(id: string, usuario: Partial<UsuarioFormData>): Promise<Usuario> {
  try {
    const response = await fetchApi(`/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'x-auth-token': getAuthToken() || ''
      },
      body: JSON.stringify(usuario)
    });
    
    return response;
  } catch (err) {
    console.error(`Erro ao atualizar usuário com ID ${id}:`, err);
    
    if (useMockData) {
      // Mock de resposta para desenvolvimento
      return {
        id,
        nome: usuario.nome || 'Nome Mockado',
        nomeUsuario: usuario.nomeUsuario || 'usuario_mockado',
        cargoId: (usuario.cargo === 'Administrador') ? 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF' : '8D7C5F3A-9B2E-4D1F-8E6A-7C9D3F2B1A0E',
        cargo: usuario.cargo || 'Usuário',
        ativo: usuario.ativo !== undefined ? usuario.ativo : true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        ultimoLogin: null
      };
    }
    
    throw err;
  }
}

// Função para excluir usuário
export async function excluirUsuario(id: string): Promise<void> {
  try {
    await fetchApi(`/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': getAuthToken() || ''
      }
    });
  } catch (err) {
    console.error(`Erro ao excluir usuário com ID ${id}:`, err);
    
    if (useMockData) {
      // Mock não faz nada, apenas simula sucesso
      return;
    }
    
    throw err;
  }
}

// Função para buscar a preferência de tema do usuário do backend
export async function buscarPreferenciaTema(): Promise<boolean | null> {
  try {
    // Obter o usuário atual
    const usuarioAtual = getCurrentUser();
    if (!usuarioAtual) {
      console.error('Nenhum usuário logado para buscar preferência de tema');
      return null;
    }
    
    // Se estiver usando credenciais mestras, retornar a preferência local
    if (isUsingMasterCredentials()) {
      console.log('Usando credenciais mestras, usando preferência de tema local');
      return usuarioAtual.preferenciaModoEscuro !== undefined ? usuarioAtual.preferenciaModoEscuro : false;
    }
    
    // Buscar do backend
    const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioAtual.id}/tema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken() || ''}`,
        'x-auth-token': getAuthToken() || ''
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar preferência de tema: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Atualizar o objeto de usuário no localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.preferenciaModoEscuro = data.preferenciaModoEscuro;
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return data.preferenciaModoEscuro;
  } catch (error) {
    console.error('Erro ao buscar preferência de tema do backend:', error);
    // Em caso de erro, retornar a preferência atual do localStorage
    const usuarioAtual = getCurrentUser();
    return usuarioAtual?.preferenciaModoEscuro !== undefined ? usuarioAtual.preferenciaModoEscuro : null;
  }
}

// Função para atualizar a preferência de tema do usuário (apenas modo claro ou escuro)
export async function atualizarPreferenciaTema(preferenciaModoEscuro: boolean): Promise<boolean> {
  try {
    // Obter o usuário atual
    const usuarioAtual = getCurrentUser();
    if (!usuarioAtual) {
      console.error('Nenhum usuário logado para atualizar preferência de tema');
      return false;
    }
    
    // Se estiver usando credenciais mestras, apenas atualizar localmente
    if (isUsingMasterCredentials()) {
      console.log('Usando credenciais mestras, atualizando preferência de tema apenas localmente');
      // Atualizar o objeto de usuário no localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.preferenciaModoEscuro = preferenciaModoEscuro;
      localStorage.setItem('userData', JSON.stringify(userData));
      return true;
    }
    
    // Enviar a atualização para o backend
    // Verificar se o backend está disponível
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioAtual.id}/tema`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getAuthToken() || ''
        },
        body: JSON.stringify({ preferenciaModoEscuro })
      });
      
      if (response.ok) {
        console.log('Preferência de tema atualizada no backend com sucesso');
      } else {
        console.warn(`Erro ao atualizar preferência de tema no backend: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Erro ao comunicar com o backend para atualizar tema:', error);
      // Continuar mesmo com erro para atualizar localmente
    }
    
    // Atualizar o objeto de usuário no localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.preferenciaModoEscuro = preferenciaModoEscuro;
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar preferência de tema:', error);
    return false;
  }
}

// Função para listar cargos
export async function listarCargos(): Promise<{ id: string, nome: Cargo, descricao: string }[]> {
  try {
    const response = await fetchApi('/usuarios/cargos/listar', {
      method: 'GET',
      headers: {
        'x-auth-token': getAuthToken() || ''
      }
    });
    
    return response;
  } catch (err) {
    console.error('Erro ao listar cargos:', err);
    
    if (useMockData) {
      // Mock de resposta para desenvolvimento
      return [
        { id: '1', nome: 'Administrador', descricao: 'Acesso total ao sistema' },
        { id: '2', nome: 'Usuário', descricao: 'Acesso limitado ao sistema' }
      ];
    }
    
    throw err;
  }
}
