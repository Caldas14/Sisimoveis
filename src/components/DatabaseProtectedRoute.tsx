import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useDatabaseStatus } from './DatabaseStatus';

interface DatabaseProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege rotas que necessitam de conexão com o banco de dados
 * Se o banco estiver offline, redireciona para a página especificada ou para a lista de imóveis
 */
export function DatabaseProtectedRoute({ 
  children, 
  redirectTo = '/imoveis' 
}: DatabaseProtectedRouteProps) {
  const { isConnected } = useDatabaseStatus();

  // Se o banco estiver desconectado, redireciona para a página especificada
  if (!isConnected) {
    return <Navigate to={redirectTo} replace />;
  }

  // Se o banco estiver conectado, renderiza o conteúdo normalmente
  return <>{children}</>;
}

export default DatabaseProtectedRoute;
