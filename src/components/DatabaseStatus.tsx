import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Database, XCircle, AlertTriangle } from 'lucide-react';

// Criar contexto para o status do banco de dados
interface DatabaseStatusContextType {
  status: 'online' | 'offline';
  lastCheck: string | null;
  isConnected: boolean;
}

const DatabaseStatusContext = createContext<DatabaseStatusContextType>({
  status: 'offline',
  lastCheck: null,
  isConnected: false
});

// Hook personalizado para usar o contexto
export function useDatabaseStatus() {
  return useContext(DatabaseStatusContext);
}

// Provedor do contexto
interface DatabaseStatusProviderProps {
  children: ReactNode;
}

export function DatabaseStatusProvider({ children }: DatabaseStatusProviderProps) {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  // Flag para controlar se o alerta já foi dispensado nesta sessão
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);


  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/db-status');
        const data = await response.json();
        
        // Atualizar status
        setStatus(data.status);
        setLastCheck(data.lastCheck);
        
        // Mostrar alerta apenas se o banco estiver offline e o alerta não tiver sido dispensado nesta sessão
        if (data.status === 'offline' && !showAlert && !alertDismissed) {
          setShowAlert(true);
        } else if (data.status === 'online') {
          // Se o banco voltar a ficar online, resetar o status de alerta
          setShowAlert(false);
          setAlertDismissed(false);
        }
      } catch (err) {
        console.error('Erro ao verificar status do banco:', err);
        setStatus('offline');
        
        // Mostrar alerta apenas se não tiver sido dispensado nesta sessão
        if (!alertDismissed) {
          setShowAlert(true);
        }
      }
    };

    // Verificar status inicial
    checkStatus();

    // Configurar verificação periódica a cada 5 segundos
    const interval = setInterval(checkStatus, 5000);

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [showAlert]);

  return (
    <>
      {/* Popup de alerta quando o banco está desconectado */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 dark:text-white">
            <div className="mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Banco de Dados Desconectado</h2>
            </div>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              O sistema não conseguiu estabelecer conexão com o banco de dados. 
              Não será possível realizar cadastros ou modificações até que a conexão seja restabelecida.
            </p>
            <p className="mb-6 text-gray-700 dark:text-gray-300 font-semibold">
              Por favor, entre em contato com o setor de T.I. para resolver este problema.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  // Marcar o alerta como dispensado para esta sessão
                  setAlertDismissed(true);
                  setShowAlert(false);
                }}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Provedor de contexto - Removido o indicador de status do banco que aparecia no topo */}
      <DatabaseStatusContext.Provider value={{ status, lastCheck, isConnected: status === 'online' }}>
        {children}
      </DatabaseStatusContext.Provider>
    </>
  );
}

// Componente de status do banco de dados (para uso em barras de navegação, etc.)
export function DatabaseStatusIndicator() {
  const { status, lastCheck } = useDatabaseStatus();
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
          status === 'online' 
            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' 
            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
        }`}
      >
        <div className="relative">
          {status === 'online' ? (
            <>
              <Database className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
            </>
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
        </div>
        <span className="hidden sm:inline">
          {status === 'online' ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      {lastCheck && (
        <span className="hidden text-xs text-gray-500 lg:inline">
          Atualizado: {new Date(lastCheck).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
