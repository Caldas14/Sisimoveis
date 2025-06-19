import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  isAuthenticated, 
  logout, 
  verificarToken, 
  verificarSessaoLocal 
} from '../services/usuarioService';

interface AuthContextType {
  isLoggedIn: boolean;
  checkingAuth: boolean;
  handleLogout: () => void;
  forceCheckAuth: () => Promise<boolean | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());
  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Função para fazer logout
  const handleLogout = useCallback(() => {
    logout();
    setIsLoggedIn(false);
    
    // Força redirecionamento para login usando window.location para garantir recarregamento completo
    window.location.href = '/login';
  }, []);

  // Função para verificar autenticação
  const verificarAutenticacao = useCallback(async () => {
    // Evita verificar se já está verificando
    if (checkingAuth) return;
    
    setCheckingAuth(true);
    // Reduzindo logs de autenticação
    // console.log('Verificando autenticação no servidor...');
    
    try {
      // Primeiro verifica localmente
      const autenticadoLocal = verificarSessaoLocal();
      
      if (!autenticadoLocal) {
        console.log('Sessão local inválida, fazendo logout');
        handleLogout();
        return;
      }
      
      // SEMPRE verifica com o backend - parte crítica
      try {
        const tokenValido = await verificarToken();
        
        if (!tokenValido) {
          // console.log('Token inválido no backend, fazendo logout');
          handleLogout();
          return false;
        } else {
          // console.log('Token validado com sucesso no backend');
          setIsLoggedIn(true);
          return true;
        }
      } catch (error) {
        console.error('Erro ao verificar token no backend:', error);
        // Tratamento mais rigoroso: se não conseguir validar no backend, faz logout
        console.log('Falha na comunicação com o backend, fazendo logout por segurança');
        handleLogout();
        return false;
      }
    } finally {
      setCheckingAuth(false);
    }
  }, [handleLogout]);
  
  // Função pública para forçar verificação de autenticação
  const forceCheckAuth = useCallback(async () => {
    // console.log('Forçando verificação de autenticação...');
    
    // Verifica localmente se existe um token
    const existeToken = isAuthenticated();
    
    // Se não existe token nem mesmo localmente
    if (!existeToken) {
      console.log('Não existe token local, redirecionando para login');
      setIsLoggedIn(false);
      
      if (!location.pathname.includes('/login')) {
        navigate('/login', { replace: true });
      }
      return false;
    }
    
    // Se existe token, SEMPRE valida com o backend
    try {
      // Executar verificação completa, inclusive no backend
      return await verificarAutenticacao();
    } catch (error) {
      console.error('Erro durante verificação forçada:', error);
      setIsLoggedIn(false);
      
      if (!location.pathname.includes('/login')) {
        navigate('/login', { replace: true });
      }
      return false;
    }
  }, [navigate, location.pathname, verificarAutenticacao]);

  // Verificar autenticação ao montar o componente - apenas uma vez
  useEffect(() => {
    // Verificação inicial única
    const verificarInicial = async () => {
      // Apenas uma verificação inicial é suficiente
      await forceCheckAuth();
    };
    verificarInicial();
    
    // Verificar autenticação a cada 5 minutos
    const interval = setInterval(() => {
      // console.log('Verificando autenticação periodicamente...');
      verificarAutenticacao();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [location.pathname, forceCheckAuth, verificarAutenticacao]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, checkingAuth, handleLogout, forceCheckAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
