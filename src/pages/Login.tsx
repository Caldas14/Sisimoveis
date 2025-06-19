import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User, AlertCircle, Key, Database } from 'lucide-react';
import { login, isAuthenticated } from '../services/usuarioService';
import cehopLogo from '../assets/cropped-cehop123-1.png';
import { useDatabaseStatus } from '../components/DatabaseStatus';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { isConnected, lastCheck } = useDatabaseStatus(); // Usando o status do banco de dados
  const [credentials, setCredentials] = useState({
    nomeUsuario: '',
    senha: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validar campos
      if (!credentials.nomeUsuario || !credentials.senha) {
        throw new Error('Por favor, preencha todos os campos.');
      }

      // Fazer login
      const response = await login(credentials);
      console.log('Login bem-sucedido:', response);

      // Redirecionar para a página inicial ou para a URL de retorno
      const searchParams = new URLSearchParams(location.search);
      const returnUrl = searchParams.get('returnUrl') || '/';
      navigate(returnUrl);
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center">
          <div className="w-full flex justify-center mb-4">
            <img 
              src={cehopLogo} 
              alt="CEHOP Logo" 
              className="h-20 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Cadastro de Imóveis
          </h2>
          <div className="h-1 w-20 bg-blue-500 mt-2 mb-4 rounded-full"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Entre com suas credenciais para acessar o sistema
          </p>
          
          {/* Indicador de status do banco de dados */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Database className="h-3.5 w-3.5" />
                {isConnected ? 'Banco de dados conectado' : 'Banco de dados desconectado'}
                {lastCheck && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                    ({new Date(lastCheck).toLocaleTimeString()})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nomeUsuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Usuário</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  id="nomeUsuario"
                  name="nomeUsuario"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                  placeholder="Digite seu nome de usuário"
                  value={credentials.nomeUsuario}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                  placeholder="Digite sua senha"
                  value={credentials.senha}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-offset-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-200" />
              </span>
              <span className="font-semibold">{isLoading ? 'Entrando...' : 'Entrar no Sistema'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
