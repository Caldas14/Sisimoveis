import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import { getCurrentUser } from '../services/usuarioService';

interface ThemeSelectorProps {
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const { darkMode, setThemePreference } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [currentPreference, setCurrentPreference] = useState<boolean>(darkMode);
  
  // Obter a preferência atual do usuário
  useEffect(() => {
    const getUserPreference = (): boolean => {
      try {
        const usuarioAtual = getCurrentUser();
        if (usuarioAtual && 'preferenciaModoEscuro' in usuarioAtual) {
          // Se for null, usamos o valor atual do darkMode
          return usuarioAtual.preferenciaModoEscuro === null ? darkMode : !!usuarioAtual.preferenciaModoEscuro;
        }
        return darkMode;
      } catch (error) {
        console.error('Erro ao obter preferência de tema:', error);
        return darkMode;
      }
    };
    
    setCurrentPreference(getUserPreference());
  }, [darkMode]); // Atualizar quando o modo escuro mudar
  
  // Função para definir o tema e fechar o menu
  const setTheme = (preference: boolean) => {
    setThemePreference(preference);
    setShowOptions(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
        aria-label="Configurações de tema"
      >
        {currentPreference ? (
          <FaMoon className="text-xl text-yellow-500" />
        ) : (
          <FaSun className="text-xl text-yellow-500" />
        )}
      </button>
      
      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => setTheme(true)}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                currentPreference === true
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-200'
              } hover:bg-gray-100 dark:hover:bg-gray-700`}
              role="menuitem"
            >
              <FaMoon className="mr-3 text-yellow-500" />
              Modo Escuro
            </button>
            
            <button
              onClick={() => setTheme(false)}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                currentPreference === false
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-200'
              } hover:bg-gray-100 dark:hover:bg-gray-700`}
              role="menuitem"
            >
              <FaSun className="mr-3 text-yellow-500" />
              Modo Claro
            </button>
            

          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
