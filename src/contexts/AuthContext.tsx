import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());
  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);
  const navigate = useNavigate();

  // Função para fazer logout
  const handleLogout = useCallback(() => {
    logout();
    setIsLoggedIn(false);
    navigate('/login');
  }, [navigate]);

  // Função para verificar autenticação
  const verificarAutenticacao = useCallback(async () => {
    // Evita verificar se já está verificando
    if (checkingAuth) return;
    
    setCheckingAuth(true);
    
    try {
      // Primeiro verifica localmente
      const autenticadoLocal = verificarSessaoLocal();
      
      if (!autenticadoLocal) {
        console.log('Sessão local inválida, fazendo logout');
        handleLogout();
        return;
      }
      
      // Depois tenta verificar com o backend
      try {
        const tokenValido = await verificarToken();
        
        if (!tokenValido) {
          console.log('Token inválido no backend, fazendo logout');
          handleLogout();
        } else {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Erro ao verificar token no backend:', error);
        // Se não conseguir verificar com o backend, mantém o status local
      }
    } finally {
      setCheckingAuth(false);
    }
  }, [handleLogout]);

  // Verificar autenticação ao montar o componente - apenas uma vez
  useEffect(() => {
    // Evita verificar se não estiver logado
    if (!isAuthenticated()) {
      return;
    }
    
    // Verificação inicial
    const verificarInicial = () => {
      verificarAutenticacao();
    };
    verificarInicial();
    
    // Verificar autenticação a cada 5 minutos
    const interval = setInterval(() => {
      console.log('Verificando autenticação periodicamente...');
      verificarAutenticacao();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependência vazia para executar apenas uma vez na montagem

  return (
    <AuthContext.Provider value={{ isLoggedIn, checkingAuth, handleLogout }}>
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
