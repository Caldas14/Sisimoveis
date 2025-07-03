import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { atualizarPreferenciaTema, getCurrentUser, buscarPreferenciaTema } from '../services/usuarioService';

// Função para definir cookie com expiração
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

// Função para obter valor de cookie
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setThemePreference: (preference: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Função para obter o modo do tema atual baseado na preferência do usuário
  const getThemePreference = useCallback(() => {
    // 1. Primeira prioridade: verificar cookie (para sincronização entre abas)
    const themeCookie = getCookie('darkMode');
    if (themeCookie !== null) {
      return themeCookie === 'true';
    }
    
    // 2. Segunda prioridade: verificar preferência do usuário no localStorage/userData
    const usuarioAtual = getCurrentUser();
    if (usuarioAtual && 'preferenciaModoEscuro' in usuarioAtual) {
      if (usuarioAtual.preferenciaModoEscuro !== null) {
        console.log('Aplicando preferência do usuário:', usuarioAtual.preferenciaModoEscuro);
        // Salvar em cookie para sincronizar entre abas
        setCookie('darkMode', usuarioAtual.preferenciaModoEscuro ? 'true' : 'false');
        return usuarioAtual.preferenciaModoEscuro === true;
      }
    }
    
    // 3. Terceira prioridade: verificar localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      // Salvar em cookie para sincronizar entre abas
      setCookie('darkMode', savedTheme);
      return savedTheme === 'true';
    }
    
    // 4. Quarta prioridade: usar padrão (modo claro)
    return false;
  }, []);

  // Inicializar o estado com a preferência do usuário
  const [darkMode, setDarkMode] = useState(() => {
    // No SSR, retornar false como padrão
    if (typeof window === 'undefined') return false;
    return getThemePreference();
  });

  // Atualizar o localStorage, cookies e a classe no documento quando o modo escuro mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Atualizar localStorage
    localStorage.setItem('darkMode', darkMode.toString());
    
    // Atualizar cookie (para sincronização entre abas)
    setCookie('darkMode', darkMode.toString());
    
    // Atualizar classe no documento
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Broadcast para outras abas usando BroadcastChannel API
    try {
      const bc = new BroadcastChannel('theme_channel');
      bc.postMessage({ darkMode });
      bc.close();
    } catch (error) {
      console.log('BroadcastChannel não suportado neste navegador');
    }
    
  }, [darkMode]);

  // Ouvir mudanças no tema de outras abas e verificar periodicamente com o backend
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let bc: BroadcastChannel | null = null;
    
    try {
      bc = new BroadcastChannel('theme_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.darkMode !== undefined) {
          // Atualizar tema apenas se for diferente do atual
          if (event.data.darkMode !== darkMode) {
            setDarkMode(event.data.darkMode);
          }
        }
      };
    } catch (error) {
      console.log('BroadcastChannel não suportado neste navegador, usando fallbacks');
    }
    
    // Função para verificar a preferência de tema no backend
    const checkThemeFromBackend = async () => {
      const usuarioAtual = getCurrentUser();
      // Só verifica no backend se o usuário estiver logado
      if (usuarioAtual && usuarioAtual.id) {
        try {
          const backendTheme = await buscarPreferenciaTema();
          console.log('[DEBUG] Tema recebido do backend:', backendTheme);
          console.log('[DEBUG] Tema atual no frontend:', darkMode);
          
          if (backendTheme !== null && backendTheme !== darkMode) {
            console.log('[APLICANDO] Tema atualizado do backend:', backendTheme);
            // Atualizar todos os armazenamentos locais com o valor do backend
            // IMPORTANTE: O backend é a fonte da verdade
            setDarkMode(backendTheme);
            setCookie('darkMode', backendTheme.toString());
            localStorage.setItem('darkMode', backendTheme.toString());
            
            // Atualizar userData também
            try {
              const userData = JSON.parse(localStorage.getItem('userData') || '{}');
              userData.preferenciaModoEscuro = backendTheme;
              localStorage.setItem('userData', JSON.stringify(userData));
              console.log('[DEBUG] userData atualizado com tema do backend');
            } catch (e) {
              console.error('Erro ao atualizar userData com tema:', e);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar tema do backend:', error);
        }
      }
    };
    
    // Verificar se o cookie mudou quando a janela ganhar foco
    const handleFocus = () => {
      checkThemeFromBackend(); // Verificar preferência no backend ao ganhar foco
      const cookieTheme = getCookie('darkMode');
      if (cookieTheme !== null && cookieTheme === 'true' !== darkMode) {
        setDarkMode(cookieTheme === 'true');
      }
    };
    
    // Verificar localStorage quando a janela ganhar foco (fallback secundário)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'darkMode' && e.newValue !== null) {
        setDarkMode(e.newValue === 'true');
      } else if (e.key === 'userData') {
        // Se os dados do usuário foram alterados (login/logout)
        checkThemeFromBackend(); // Verificar preferência no backend quando mudar dados do usuário
        const newPref = getThemePreference();
        if (newPref !== darkMode) {
          setDarkMode(newPref);
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageEvent);
    
    // Verificar o tema do backend imediatamente
    checkThemeFromBackend();
    
    // Intervalo para verificar mudanças locais (mais frequente)
    const localCheckInterval = setInterval(() => {
      const cookieTheme = getCookie('darkMode');
      if (cookieTheme !== null && cookieTheme === 'true' !== darkMode) {
        setDarkMode(cookieTheme === 'true');
      }
      
      // Verificar se o usuário mudou
      const usuarioAtual = getCurrentUser();
      if (usuarioAtual && 'preferenciaModoEscuro' in usuarioAtual) {
        const userPref = usuarioAtual.preferenciaModoEscuro === true;
        if (userPref !== darkMode) {
          setDarkMode(userPref);
        }
      }
    }, 1000); // Verificar localmente a cada segundo
    
    // Intervalo para verificar mudanças no backend (menos frequente para não sobrecarregar)
    const backendCheckInterval = setInterval(() => {
      checkThemeFromBackend();
    }, 10000); // Verificar com o backend a cada 10 segundos
    
    return () => {
      if (bc) bc.close();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(localCheckInterval);
      clearInterval(backendCheckInterval);
    };
  }, [darkMode, getThemePreference]);

  // Função para alternar o modo escuro e salvar no banco de dados
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      // Salvar a preferência no banco de dados
      atualizarPreferenciaTema(newValue)
        .then(() => {
          console.log('Preferência de tema salva com sucesso');
          // Forçar atualização em todas as abas
          setCookie('darkMode', newValue.toString());
          localStorage.setItem('darkMode', newValue.toString());
          
          // Atualizar dados do usuário no localStorage
          try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.preferenciaModoEscuro = newValue;
            localStorage.setItem('userData', JSON.stringify(userData));
          } catch (error) {
            console.error('Erro ao atualizar userData:', error);
          }
        })
        .catch(error => console.error('Erro ao salvar preferência de tema:', error));
        
      return newValue;
    });
  }, []);

  // Função para definir uma preferência específica (apenas true ou false)
  const setThemePreference = useCallback((preference: boolean) => {
    setDarkMode(preference);
    
    // Salvar a preferência em vários locais para garantir sincronização
    Promise.all([
      // 1. Salvar no banco de dados
      atualizarPreferenciaTema(preference),
      
      // 2. Salvar em localStorage e cookies sincronamente
      Promise.resolve().then(() => {
        localStorage.setItem('darkMode', preference.toString());
        setCookie('darkMode', preference.toString());
        
        // 3. Atualizar dados do usuário no localStorage
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          userData.preferenciaModoEscuro = preference;
          localStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
          console.error('Erro ao atualizar userData:', error);
        }
      })
    ])
    .then(() => console.log('Preferência de tema salva em todos os locais'))
    .catch(error => console.error('Erro ao salvar preferência de tema:', error));
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
