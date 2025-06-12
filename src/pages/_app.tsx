import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AuthGuard from '../components/AuthGuard';

// Lista de rotas públicas que não precisam de autenticação
const publicRoutes = ['/login'];

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Evitar problemas de hidratação do Next.js
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Verificar se a rota atual é pública
  const isPublicRoute = publicRoutes.includes(router.pathname);
  
  // Renderizar apenas do lado do cliente para evitar erros de hidratação
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      {isPublicRoute ? (
        // Se for uma rota pública, renderizar o componente normalmente
        <Component {...pageProps} />
      ) : (
        // Se for uma rota protegida, envolver com o AuthGuard
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      )}
    </>
  );
}
