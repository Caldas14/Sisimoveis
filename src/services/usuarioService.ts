import { Usuario, UsuarioFormData, LoginCredentials, LoginResponse, Cargo } from '../types/usuario';
import { fetchApi } from '../services/apiService';

// Dados vazios para fallback
const dadosVazios: Usuario[] = [];

// Variáveis para controlar o comportamento do serviço
let useMockData = false; // Controla se devemos usar dados mockados em vez da API

// Função para fazer login
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
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
    }
    
    return response;
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    
    // Erro de login, não há fallback para login
    throw new Error('Falha na autenticação');
    
    throw err;
  }
}

// Função para fazer logout
export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
}

// Função para verificar se o usuário está autenticado
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
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
export function getCurrentUser(): { id: string; nome: string; nomeUsuario: string; cargoId: string | number; } | null {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      return null;
    }
    
    return JSON.parse(userDataStr);
  } catch (err) {
    console.error('Erro ao obter dados do usuário:', err);
    return null;
  }
}

// Função para verificar se o token ainda é válido no backend
export async function verificarToken(): Promise<boolean> {
  try {
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
    // Se houver erro na verificação, consideramos o token inválido
    return false;
  }
}

// Função para verificar a sessão localmente (fallback quando o backend não está disponível)
export function verificarSessaoLocal(): boolean {
  const token = getAuthToken();
  const userData = getCurrentUser();
  
  return !!token && !!userData;
}

// Função para listar todos os usuários (apenas admin)
export async function listarUsuarios(): Promise<Usuario[]> {
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
    
    if (useMockData) {
      // Mock de resposta para desenvolvimento
      return [
        {
          id: '1',
          nome: 'Administrador',
          nomeUsuario: 'admin',
          cargo: 'Administrador',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ultimoLogin: new Date().toISOString()
        },
        {
          id: '2',
          nome: 'Usuário Teste',
          nomeUsuario: 'usuario',
          cargo: 'Usuário',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ultimoLogin: null
        }
      ];
    }
    
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
