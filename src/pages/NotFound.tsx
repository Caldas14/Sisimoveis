import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Building2 } from 'lucide-react';

export default function NotFound() {
  const { darkMode } = useTheme();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in">
      <Building2 className="h-20 w-20 text-primary-300" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Página não encontrada</h1>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
        Desculpe, não conseguimos encontrar a página que você está procurando.
      </p>
      <div className="mt-6">
        <Link to="/" className="btn btn-primary">
          Voltar para Dashboard
        </Link>
      </div>
    </div>
  );
}