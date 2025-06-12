import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  File,
  Image,
  Archive,
  Table,
  Code
} from 'lucide-react';

interface DocumentoVinculado {
  Id: string;
  ImovelId: string;
  Caminho: string;
  Nome: string;
  Tipo: string;
  DataCriacao: string;
}

interface DocumentosImovelProps {
  imovelId: string;
  onDocumentosCarregados?: (documentos: DocumentoVinculado[]) => void;
}

export default function DocumentosImovel({ imovelId, onDocumentosCarregados }: DocumentosImovelProps) {
  const { darkMode } = useTheme();
  const [documentos, setDocumentos] = useState<DocumentoVinculado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarUpload, setMostrarUpload] = useState<boolean>(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  // Tipo de documento removido conforme solicitado
  const [diretorioDocumentos, setDiretorioDocumentos] = useState<string>('');
  const [uploadProgresso, setUploadProgresso] = useState<number>(0);
  
  // Lista de tipos de documentos removida conforme solicitado
  
  // Carregar documentos ao iniciar
  useEffect(() => {
    if (imovelId) {
      carregarDocumentos();
      carregarConfiguracao();
    }
  }, [imovelId]);
  
  // Função para carregar documentos
  const carregarDocumentos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const response = await fetch(`/api/documentos/imovel/${imovelId}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar documentos: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Documentos carregados:', data);
      
      // Log simplificado
      if (data.length > 0) {
        console.log('Exemplo de documento:', data[0]);
      }
      
      setDocumentos(data);
      
      // Chamar a callback se existir
      if (onDocumentosCarregados) {
        onDocumentosCarregados(data);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setErro('Erro ao carregar documentos. Verifique se o servidor está em execução.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para carregar configuração do diretório
  const carregarConfiguracao = async () => {
    try {
      const response = await fetch('/api/documentos/config');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar configuração: ${response.status}`);
      }
      
      const data = await response.json();
      setDiretorioDocumentos(data.diretorio);
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
    }
  };
  
  // Função para abrir arquivo local usando a API do servidor
  const abrirArquivoLocal = async (caminho: string) => {
    try {
      setErro(null); // Limpar erros anteriores
      
      // Extrair a extensão do arquivo
      const extensao = caminho.split('.').pop()?.toLowerCase() || '';
      console.log(`Abrindo arquivo com extensão: ${extensao}`);
      
      // Usar a API do servidor para abrir o arquivo local
      const response = await fetch('/api/arquivo/abrir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          caminhoArquivo: caminho
        })
      });
      
      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.error || 'Erro ao abrir arquivo');
      }
      
      const resultado = await response.json();
      console.log('Resposta do servidor:', resultado);
      
      // Sucesso - o servidor abriu o arquivo
      console.log('Arquivo aberto com sucesso pelo servidor');
    } catch (err) {
      console.error('Erro ao abrir arquivo:', err);
      setErro(`Erro ao abrir arquivo: ${err.message}`);
      
      // Mostrar mensagem mais amigável para o usuário
      alert(`Não foi possível abrir o arquivo. Verifique se o caminho existe e se você tem permissão para acessá-lo.\n\nCaminho: ${caminho}`);
    }
  };
  
  // Função para vincular documento
  const vincularDocumento = async () => {
    if (!arquivoSelecionado || !imovelId) {
      setErro('Selecione um arquivo e um tipo de documento para continuar');
      return;
    }
    
    // Validação de tipo de documento removida conforme solicitado
    
    // Log de tipo de documento removido conforme solicitado
    
    try {
      setErro(null);
      setUploadProgresso(10);
      
      // Obter o caminho completo do arquivo local
      // No caso do input file, o caminho é mascarado por segurança
      
      // Tentar obter o caminho completo do arquivo
      let caminhoDocumento = '';
      
      // Verificar se temos acesso ao caminho completo (propriedade path)
      if ((arquivoSelecionado as any).path) {
        // Usar o caminho completo se disponível
        caminhoDocumento = (arquivoSelecionado as any).path;
        console.log('Usando caminho completo do arquivo:', caminhoDocumento);
      } else {
        // Caso contrário, usar o nome do arquivo
        caminhoDocumento = arquivoSelecionado.name;
        console.log('Usando apenas o nome do arquivo:', caminhoDocumento);
        
        // Tentar obter o caminho completo usando o webkitRelativePath se disponível
        if ((arquivoSelecionado as any).webkitRelativePath) {
          const relativePath = (arquivoSelecionado as any).webkitRelativePath;
          console.log('Caminho relativo disponível:', relativePath);
          // Extrair o diretório do caminho relativo
          const directory = relativePath.split('/').slice(0, -1).join('/');
          if (directory) {
            caminhoDocumento = `${directory}/${arquivoSelecionado.name}`;
            console.log('Caminho combinado:', caminhoDocumento);
          }
        }
      }
      
      setUploadProgresso(30);
      
      // Garantir que temos um nome de arquivo válido
      const nomeDocumento = arquivoSelecionado.name || caminhoDocumento.split(/[\/]/).pop() || 'documento';
      
      // Tentar obter um caminho absoluto se possível
      // Verificar se o caminho já é absoluto
      const isAbsolutePath = caminhoDocumento.match(/^([A-Za-z]:\|\\|\/)/);
      console.log('Caminho é absoluto?', !!isAbsolutePath);
      
      console.log('Vinculando documento:', {
        imovelId,
        caminho: caminhoDocumento,
        nome: nomeDocumento,
        isAbsolutePath: !!isAbsolutePath
      });
      
      setUploadProgresso(50);
      
      // Vincular o documento ao imóvel
      const response = await fetch('/api/documentos/vincular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imovelId,
          caminho: caminhoDocumento,
          nome: nomeDocumento,
          isAbsolutePath: !!isAbsolutePath
        })
      });
      
      setUploadProgresso(80);
      
      if (!response.ok) {
        throw new Error(`Erro ao vincular documento: ${response.status}`);
      }
      
      // Recarregar documentos
      carregarDocumentos();
      
      // Limpar formulário
      setArquivoSelecionado(null);
      setMostrarUpload(false);
      setUploadProgresso(0);
    } catch (err) {
      console.error('Erro ao vincular documento:', err);
      setErro('Erro ao vincular documento. Verifique se o servidor está em execução.');
    }
  };
  
  // Função para desvincular documento
  const desvincularDocumento = async (documentoId: string) => {
    if (!documentoId) return;
    
    try {
      const response = await fetch(`/api/documentos/${documentoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao desvincular documento: ${response.status}`);
      }
      
      // Remover o documento da lista
      setDocumentos(prev => prev.filter(doc => doc.Id !== documentoId));
    } catch (err) {
      console.error('Erro ao desvincular documento:', err);
      setErro('Erro ao desvincular documento. Verifique se o servidor está em execução.');
    }
  };
  
  // Função para obter ícone baseado no nome do arquivo
  const obterIconeArquivo = (nomeArquivo: string) => {
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase();
    
    switch (extensao) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-5 h-5 text-yellow-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <Table className="w-5 h-5 text-green-500" />;
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'json':
        return <Code className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-4 mt-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Documentos do Imóvel
        </h2>
        
        <button
          onClick={() => setMostrarUpload(!mostrarUpload)}
          className={`px-3 py-1 rounded-md flex items-center text-sm
                    ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          {mostrarUpload ? 'Cancelar' : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </>
          )}
        </button>
      </div>
      
      {/* Formulário de upload */}
      {mostrarUpload && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-md font-medium mb-3">Vincular Documento</h3>
          
          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Arquivo
              </label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        // Tentar obter o caminho completo do arquivo
                        // Em navegadores web isso é limitado por segurança
                        const filePath = (file as any).path || file.name;
                        
                        // Criar um objeto personalizado com o caminho completo
                        setArquivoSelecionado({
                          ...file,
                          path: filePath
                        } as File);
                      }
                    }}
                    className={`block w-full text-sm ${darkMode ? 'text-gray-300 file:bg-gray-600 file:text-white' : 'text-gray-700 file:bg-gray-200'} 
                            file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium
                            ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-md`}
                  />
                </div>
                
                <div className="text-xs text-gray-500">
                  Selecione um arquivo do seu computador para vincular ao imóvel.
                  O sistema salvará apenas o caminho para o arquivo, não o arquivo em si.
                </div>
              </div>
              {arquivoSelecionado && (
                <div className="mt-2 p-2 rounded-md bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-800 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    {arquivoSelecionado.name} ({(arquivoSelecionado.size / 1024).toFixed(2)} KB)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Caminho: {(arquivoSelecionado as any).path || 'Não disponível'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Campo de tipo de documento removido conforme solicitado */}
            
            <div className="flex justify-end">
              <button
                onClick={vincularDocumento}
                disabled={!arquivoSelecionado}
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white
                          ${!arquivoSelecionado ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-4 h-4 mr-2 inline-block" />
                Vincular Documento
              </button>
            </div>
            
            {uploadProgresso > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgresso}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center mt-1">{uploadProgresso}%</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200">
          <p className="text-sm">{erro}</p>
        </div>
      )}
      
      {/* Lista de documentos */}
      {carregando ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-sm">Carregando documentos...</span>
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum documento vinculado a este imóvel.</p>
          <button
            onClick={() => setMostrarUpload(true)}
            className={`mt-3 px-3 py-1 rounded-md text-sm
                      ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Adicionar Documento
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento, index) => (
                <tr 
                  key={index}
                  className={`${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} border-b`}
                >
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => abrirArquivoLocal(documento.Caminho)}
                      className="flex items-center hover:text-blue-500"
                    >
                      {obterIconeArquivo(documento.Nome)}
                      <span className="ml-2">{documento.Nome}</span>
                    </button>
                  </td>
                  {/* Coluna de tipo removida conforme solicitado */}
                  <td className="px-4 py-3">{new Date(documento.DataCriacao).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => abrirArquivoLocal(documento.Caminho)}
                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-100'}`}
                        title="Abrir documento"
                      >
                        <Download className="w-4 h-4 text-blue-500" />
                      </button>
                      <button 
                        onClick={() => desvincularDocumento(documento.Id)}
                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-red-700' : 'hover:bg-red-100'}`}
                        title="Desvincular documento"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
