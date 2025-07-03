import { Menu, LogOut, User } from 'lucide-react';
import cehopLogo from '/cropped-cehop123-1.png';
import { useDatabaseStatus } from '../DatabaseStatus';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/usuarioService';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSelector from '../ThemeSelector';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Usuário');
  const { darkMode } = useTheme();
  const { isConnected } = useDatabaseStatus();
  
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.nome || 'Usuário');
      }
    } catch (err) {
      console.error('Erro ao obter dados do usuário:', err);
    }
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="h-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between gap-4">
          {/* Logo e Menu Mobile */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onMenuClick}
              className="-m-2.5 p-2.5 text-gray-600 hover:text-gray-900 lg:hidden"
            >
              <span className="sr-only">Abrir menu</span>
              <Menu className="h-5 w-5" />
            </button>

            <a 
              href="/" 
              className="flex items-center text-primary-600 hover:text-primary-700 transition-colors"
            >
              <div className={`${darkMode ? 'bg-white p-1 rounded' : ''} hidden sm:block`}>
                <img 
                  src={cehopLogo} 
                  alt="CEHOP" 
                  className="h-8" 
                />
              </div>
              <span className="sm:hidden text-xl font-bold">CH</span>
            </a>
          </div>

          {/* Espaço flexível para centralizar os elementos restantes */}
          <div className="hidden lg:block flex-1"></div>

          {/* Status do Banco e Usuário */}
          <div className="flex items-center gap-6">
            {/* Indicador de status do banco de dados */}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'Banco online' : 'Banco offline'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {userName}
                </span>
              </div>

              <ThemeSelector className="rounded-full" />
              
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="sr-only">Sair</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}