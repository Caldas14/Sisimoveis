import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { adicionarValorPersonalizado } from '../services/valoresPersonalizadosService';
import { useTheme } from '../contexts/ThemeContext';

interface AdicionarValorPersonalizadoProps {
  categoria: string;
  onAdicionar: (novoValor: string) => void;
  onCancelar: () => void;
}

export default function AdicionarValorPersonalizado({ categoria, onAdicionar, onCancelar }: AdicionarValorPersonalizadoProps) {
  const { darkMode } = useTheme();
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async () => {
    if (!valor.trim()) {
      setErro('O valor não pode estar em branco');
      return;
    }
    
    setErro(null);
    setCarregando(true);
    
    try {
      await adicionarValorPersonalizado(categoria, valor);
      onAdicionar(valor);
      setValor('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao adicionar valor personalizado');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={`border rounded-md p-3 mb-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'}`}>
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Adicionar novo valor para {categoria}
          </h3>
          <button 
            type="button"
            onClick={onCancelar}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
        
        {erro && (
          <div className="text-sm text-danger-600 mb-2">
            {erro}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={`flex-1 input ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
            placeholder="Digite o novo valor"
            disabled={carregando}
          />
          <button
            type="button"
            onClick={() => !carregando && handleSubmit()}
            disabled={carregando}
            className={`btn btn-primary flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            {carregando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
