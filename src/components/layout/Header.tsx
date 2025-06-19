import { Menu, Search, LogOut, Moon, Sun } from 'lucide-react';
import cehopLogo from '/cropped-cehop123-1.png';
import { useDatabaseStatus } from '../DatabaseStatus';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/usuarioService';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Usuário');
  const [userInitials, setUserInitials] = useState('U');
  const { darkMode, toggleDarkMode } = useTheme();
  const { isConnected, lastCheck } = useDatabaseStatus();
  
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.nome || 'Usuário');
        
        if (userData.nome) {
          const nameParts = userData.nome.split(' ');
          setUserInitials(
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : nameParts[0].substring(0, 2).toUpperCase()
          );
        }
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

          {/* Barra de Pesquisa */}
          <div className="hidden lg:block flex-1 max-w-2xl px-8">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                placeholder="Pesquisar imóveis..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

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
                  {userInitials}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-900">
                  {userName}
                </span>
              </div>

              <button
                onClick={toggleDarkMode}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              >
                <span className="sr-only">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-700" />
                )}
              </button>
              
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