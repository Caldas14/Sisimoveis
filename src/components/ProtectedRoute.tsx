import { ReactNode, useEffect, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdmin } from '../services/usuarioService';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * Se adminOnly for true, apenas administradores podem acessar
 */
export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { isLoggedIn, checkingAuth } = useAuth();
  
  // Verificar se é admin apenas uma vez por renderização
  const isUserAdmin = useMemo(() => {
    return isAdmin();
  }, []);
  
  // Construir URL de redirecionamento apenas uma vez
  const loginRedirectUrl = useMemo(() => {
    return `/login?returnUrl=${encodeURIComponent(location.pathname)}`;
  }, [location.pathname]);
  
  // Se estiver verificando a autenticação, mostrar um indicador de carregamento
  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Verificando autenticação...</p>
      </div>
    );
  }
  
  // Se não estiver autenticado, redirecionar para a página de login
  if (!isLoggedIn) {
    return <Navigate to={loginRedirectUrl} replace />;
  }
  
  // Se precisar ser admin, verificar se o usuário é admin
  if (adminOnly && !isUserAdmin) {
    // Se não for admin, redirecionar para a página inicial
    return <Navigate to="/" replace />;
  }
  
  // Se estiver autenticado e tiver as permissões necessárias, renderizar o conteúdo
  return <>{children}</>;
}
