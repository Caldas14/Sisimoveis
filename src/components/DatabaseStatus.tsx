import { useState, useEffect } from 'react';
import { Database, XCircle } from 'lucide-react';

export function DatabaseStatus() {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [lastCheck, setLastCheck] = useState<string | null>(null);


  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/db-status');
        const data = await response.json();
        setStatus(data.status);
        setLastCheck(data.lastCheck);

      } catch (err) {
        console.error('Erro ao verificar status do banco:', err);
        setStatus('offline');
      }
    };

    // Verificar status inicial
    checkStatus();

    // Configurar verificação periódica a cada 5 segundos
    const interval = setInterval(checkStatus, 5000);

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, []);

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
