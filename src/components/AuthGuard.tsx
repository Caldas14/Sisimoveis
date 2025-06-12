import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '../services/usuarioService';

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * Se adminOnly for true, apenas administradores podem acessar
 */
export default function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Função para verificar se o usuário está autenticado
    const authCheck = () => {
      // Se o usuário não estiver autenticado, redirecionar para a página de login
      if (!isAuthenticated()) {
        setAuthorized(false);
        router.push({
          pathname: '/login',
          query: { returnUrl: router.asPath }
        });
      } else {
        // Se o usuário estiver autenticado, verificar se é admin (quando necessário)
        if (adminOnly) {
          // Verificar se o usuário é admin (implementar lógica)
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.cargo === 'Administrador') {
                setAuthorized(true);
              } else {
                // Redirecionar para a página inicial se não for admin
                setAuthorized(false);
                router.push('/');
              }
            } catch (err) {
              // Se houver erro ao verificar o cargo, redirecionar para o login
              setAuthorized(false);
              router.push('/login');
            }
          } else {
            // Se não houver dados do usuário, redirecionar para o login
            setAuthorized(false);
            router.push('/login');
          }
        } else {
          // Se não precisar ser admin, autorizar
          setAuthorized(true);
        }
      }
    };

    // Verificar autenticação quando a rota mudar
    authCheck();

    // Configurar evento para verificar autenticação em mudanças de rota
    const unsubscribe = router.events.subscribe(() => {
      authCheck();
    });

    // Limpar evento ao desmontar o componente
    return () => {
      unsubscribe();
    };
  }, [router, adminOnly]);

  // Renderizar children apenas se estiver autorizado
  return authorized ? <>{children}</> : null;
}
