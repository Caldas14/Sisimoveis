import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Download, 
  Trash2, 
  Search,
  Image,
  File,
  Archive,
  Table,
  Code,
  Building2,
  Home,
  Loader2,
  AlertCircle,
  Settings
} from 'lucide-react';

// Interface para documento vinculado a imóvel
interface DocumentoVinculado {
  Id: string;
  ImovelId: string;
  Caminho: string;
  Nome: string;
  DataCriacao: string;
  Matricula?: string;
  Objeto?: string;
  Localizacao?: string;
  ImovelPrincipalId?: string;
  TipoImovel?: string;
}

// Interface para imóvel secundário com documentos
interface ImovelSecundario {
  Id: string;
  Matricula: string;
  Localizacao: string;
  TipoImovelId: number;
  FinalidadeId: number;
  documentos: DocumentoVinculado[];
}

// Interface para imóvel principal com documentos e imóveis secundários
interface ImovelPrincipal {
  Id: string;
  Matricula: string;
  Localizacao: string;
  TipoImovelId: number;
  FinalidadeId: number;
  documentos: DocumentoVinculado[];
  imoveisSecundarios: ImovelSecundario[];
}

export default function Documentos() {
  const { darkMode } = useTheme();
  const [documentosPrincipais, setDocumentosPrincipais] = useState<DocumentoVinculado[]>([]);
  const [documentosSecundarios, setDocumentosSecundarios] = useState<DocumentoVinculado[]>([]);
  const [imoveisPrincipais, setImoveisPrincipais] = useState<ImovelPrincipal[]>([]);
  const [imoveisPrincipaisOriginal, setImoveisPrincipaisOriginal] = useState<ImovelPrincipal[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [termoPesquisa, setTermoPesquisa] = useState<string>('');
  
  // Estados para os filtros
  const [filtroTipoImovel, setFiltroTipoImovel] = useState<'todos' | 'principal' | 'secundario'>('todos');
  const [filtrosAplicados, setFiltrosAplicados] = useState<boolean>(false);
  
  // Função para abrir arquivo local usando a API do servidor
  const abrirArquivoLocal = async (caminho: string) => {
    try {
      // Extrair a extensão do arquivo
      const extensao = caminho.split('.').pop()?.toLowerCase() || '';
      console.log(`Tentando abrir arquivo: ${caminho} (${extensao})`);
      
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
  const [imoveisExpandidos, setImoveisExpandidos] = useState<{[key: string]: boolean}>({});
  
  // Carregar documentos ao montar o componente
  useEffect(() => {
    carregarDocumentos();
  }, []);
  
  // Função para carregar todos os documentos
  const carregarDocumentos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const response = await fetch('/api/documentos/todos');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar documentos: ${response.status}`);
      }
      
      const documentos = await response.json();
      
      // Separar documentos por tipo de imóvel (principal ou secundário)
      const principais = documentos.filter((doc: DocumentoVinculado) => doc.TipoImovel === 'Principal');
      const secundarios = documentos.filter((doc: DocumentoVinculado) => doc.TipoImovel === 'Secundário');
      
      setDocumentosPrincipais(principais);
      setDocumentosSecundarios(secundarios);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setErro('Erro ao carregar documentos. Verifique se o servidor está em execução.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para excluir um documento
  const excluirDocumento = async (documentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    
    try {
      const response = await fetch(`/api/documentos/${documentoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir documento: ${response.status}`);
      }
      
      // Recarregar documentos
      carregarDocumentos();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      setErro('Erro ao excluir documento. Verifique se o servidor está em execução.');
    }
  };
  
  // Carregar documentos ao iniciar
  useEffect(() => {
    carregarDocumentosVinculados();
  }, []);
  
  // Função para carregar documentos vinculados a imóveis
  const carregarDocumentosVinculados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const response = await fetch('/api/documentos/todos-vinculados');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar documentos vinculados: ${response.status}`);
      }
      
      const data = await response.json();
      setImoveisPrincipais(data);
      setImoveisPrincipaisOriginal(data); // Guardar os dados originais para filtros
      
      // Inicializar o estado de expansão para todos os imóveis principais
      const estadoExpansao: {[key: string]: boolean} = {};
      data.forEach((imovel: ImovelPrincipal) => {
        estadoExpansao[imovel.Id] = true; // Expandir por padrão
        
        // Também inicializar para imóveis secundários
        imovel.imoveisSecundarios.forEach((secundario) => {
          estadoExpansao[secundario.Id] = true; // Expandir por padrão
        });
      });
      setImoveisExpandidos(estadoExpansao);
    } catch (err) {
      console.error('Erro ao carregar documentos vinculados:', err);
      setErro('Erro ao carregar documentos vinculados. Verifique se o servidor está em execução.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setTermoPesquisa('');
    setFiltroTipoDocumento('');
    setFiltroTipoImovel('todos');
    setFiltrosAplicados(false);
    
    // Restaurar os dados originais
    setImoveisPrincipais(imoveisPrincipaisOriginal);
  };
  
  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    setCarregando(true);
    setFiltrosAplicados(true);
    
    try {
      // Começar com os dados originais
      let imoveisFiltrados = JSON.parse(JSON.stringify(imoveisPrincipaisOriginal));
      
      // Filtrar por termo de pesquisa
      if (termoPesquisa) {
        const termo = termoPesquisa.toLowerCase();
        
        imoveisFiltrados = imoveisFiltrados.map((imovel: ImovelPrincipal) => {
          // Filtrar documentos do imóvel principal
          const docsFiltrados = imovel.documentos.filter(doc => 
            doc.Nome?.toLowerCase().includes(termo) ||
            doc.Matricula?.toLowerCase().includes(termo) ||
            doc.Objeto?.toLowerCase().includes(termo) ||
            doc.Localizacao?.toLowerCase().includes(termo)
          );
          
          // Filtrar imóveis secundários e seus documentos
          const secundariosFiltrados = imovel.imoveisSecundarios.map(sec => {
            const docsSecFiltrados = sec.documentos.filter(doc => 
              doc.Nome?.toLowerCase().includes(termo) ||
              doc.Matricula?.toLowerCase().includes(termo) ||
              doc.Objeto?.toLowerCase().includes(termo) ||
              doc.Localizacao?.toLowerCase().includes(termo)
            );
            
            return {
              ...sec,
              documentos: docsSecFiltrados
            };
          }).filter(sec => sec.documentos.length > 0);
          
          return {
            ...imovel,
            documentos: docsFiltrados,
            imoveisSecundarios: secundariosFiltrados
          };
        }).filter(imovel => imovel.documentos.length > 0 || imovel.imoveisSecundarios.length > 0);
      }
      
      // Filtrar por tipo de imóvel
      if (filtroTipoImovel !== 'todos') {
        imoveisFiltrados = imoveisFiltrados.map((imovel: ImovelPrincipal) => {
          if (filtroTipoImovel === 'principal') {
            // Manter apenas documentos do imóvel principal
            return {
              ...imovel,
              imoveisSecundarios: []
            };
          } else if (filtroTipoImovel === 'secundario') {
            // Manter apenas imóveis secundários
            return {
              ...imovel,
              documentos: [],
              imoveisSecundarios: imovel.imoveisSecundarios
            };
          }
          return imovel;
        }).filter(imovel => 
          (filtroTipoImovel === 'principal' && imovel.documentos.length > 0) || 
          (filtroTipoImovel === 'secundario' && imovel.imoveisSecundarios.length > 0) ||
          filtroTipoImovel === 'todos'
        );
      }
      
      // Removido filtro por data
      
      // Atualizar o estado com os imóveis filtrados
      setImoveisPrincipais(imoveisFiltrados);
    } catch (err) {
      console.error('Erro ao aplicar filtros:', err);
      setErro('Erro ao aplicar filtros. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };
  

  
  // Função para pesquisar documentos
  const pesquisarDocumentos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Se há filtros avançados aplicados, use a função aplicarFiltros
      if (filtrosAplicados || filtroTipoImovel !== 'todos') {
        aplicarFiltros();
        return;
      }
      
      if (!termoPesquisa) {
        // Se não houver termo de pesquisa, recarregar todos os documentos
        carregarDocumentosVinculados();
        return;
      }
      
      const response = await fetch(`/api/documentos/pesquisar?termo=${encodeURIComponent(termoPesquisa)}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao pesquisar documentos: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Agrupar os documentos por imóvel
      const documentosPorImovel = new Map<string, DocumentoVinculado[]>();
      
      data.forEach((doc: DocumentoVinculado) => {
        if (!documentosPorImovel.has(doc.ImovelId)) {
          documentosPorImovel.set(doc.ImovelId, []);
        }
        documentosPorImovel.get(doc.ImovelId)?.push(doc);
      });
      
      // Recarregar imóveis principais para ter a estrutura completa
      await carregarDocumentosVinculados();
      
      // Filtrar imóveis principais que contêm os documentos encontrados
      const imoveisFiltrados = imoveisPrincipais.map(imovel => {
        // Verificar se este imóvel principal tem documentos na pesquisa
        const docsPrincipais = documentosPorImovel.get(imovel.Id) || [];
        
        // Filtrar imóveis secundários que têm documentos na pesquisa
        const secundariosFiltrados = imovel.imoveisSecundarios.map(sec => {
          const docsSecundarios = documentosPorImovel.get(sec.Id) || [];
          
          return {
            ...sec,
            documentos: docsSecundarios
          };
        }).filter(sec => sec.documentos.length > 0);
        
        return {
          ...imovel,
          documentos: docsPrincipais,
          imoveisSecundarios: secundariosFiltrados
        };
      }).filter(imovel => imovel.documentos.length > 0 || imovel.imoveisSecundarios.length > 0);
      
      setImoveisPrincipais(imoveisFiltrados);
    } catch (err) {
      console.error('Erro ao pesquisar documentos:', err);
      setErro('Erro ao pesquisar documentos. Verifique se o servidor está em execução.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para obter ícone baseado no nome do arquivo
  const obterIconeArquivo = (nomeArquivo: string | undefined | null) => {
    if (!nomeArquivo) return <File className="w-5 h-5 text-gray-500" />;
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
  
  // Função para truncar nome de arquivo
  const truncarNomeArquivo = (nome: string | undefined | null, maxLength: number = 30) => {
    if (!nome) return 'Sem nome';
    if (nome.length <= maxLength) return nome;
    const extensao = nome.split('.').pop() || '';
    const nomeBase = nome.substring(0, nome.length - extensao.length - 1);
    return nomeBase.substring(0, maxLength - 3 - extensao.length) + '...' + '.' + extensao;
  };
  
  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Documentos por Imóvel
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Gerenciador de documentos vinculados aos imóveis
          </p>
          {filtrosAplicados && (
            <div className="mt-2 flex items-center">
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                Filtros aplicados
              </span>

              {filtroTipoImovel !== 'todos' && (
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                  Imóvel: {filtroTipoImovel === 'principal' ? 'Principal' : 'Secundário'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Barra de pesquisa e filtros */}
      <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col space-y-4">
          {/* Linha 1: Pesquisa principal */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                placeholder="Pesquisar por nome, matrícula, objeto ou localização..."
                onKeyDown={(e) => e.key === 'Enter' && pesquisarDocumentos()}
              />
            </div>
            <div className="sm:ml-2">
              <button
                type="button"
                onClick={pesquisarDocumentos}
                className={`w-full sm:w-auto px-4 py-2 rounded-md ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } flex items-center justify-center`}
                disabled={carregando}
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Pesquisando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Pesquisar
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Linha 2: Filtros avançados */}
          <div className="grid grid-cols-1 gap-4">
            {/* Filtro por tipo de imóvel */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tipo de Imóvel
              </label>
              <select
                value={filtroTipoImovel}
                onChange={(e) => setFiltroTipoImovel(e.target.value as 'todos' | 'principal' | 'secundario')}
                className={`block w-full py-2 px-3 border rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                <option value="todos">Todos os imóveis</option>
                <option value="principal">Apenas principais</option>
                <option value="secundario">Apenas secundários</option>
              </select>
            </div>
          </div>
          
          {/* Linha 3: Botões de ação */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={limparFiltros}
              className={`px-3 py-1.5 text-sm rounded-md ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Limpar Filtros
            </button>
            <button
              type="button"
              onClick={aplicarFiltros}
              className={`px-3 py-1.5 text-sm rounded-md ${
                darkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
      
      {/* Exibição dos documentos por imóvel */}
      <div className="mt-6">
        {carregando ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : erro ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-700'}`}>
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{erro}</span>
            </div>
          </div>
        ) : imoveisPrincipais.length === 0 ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            Nenhum imóvel com documentos encontrado.
          </div>
        ) : (
          <div className="space-y-6">
            {imoveisPrincipais.map((imovelPrincipal) => (
              <div 
                key={imovelPrincipal.Id} 
                className={`rounded-lg overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                {/* Cabeçalho do imóvel principal */}
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => setImoveisExpandidos(prev => ({
                    ...prev,
                    [imovelPrincipal.Id]: !prev[imovelPrincipal.Id]
                  }))}
                >
                  <div className="flex items-center">
                    <Building2 className={`mr-2 h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {imovelPrincipal.Matricula}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {imovelPrincipal.Localizacao} - Tipo: {imovelPrincipal.TipoImovelId} (Finalidade: {imovelPrincipal.FinalidadeId})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                      {imovelPrincipal.documentos.length} documentos
                    </span>
                    {imoveisExpandidos[imovelPrincipal.Id] ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>
                
                {/* Conteúdo do imóvel principal (documentos e imóveis secundários) */}
                {imoveisExpandidos[imovelPrincipal.Id] && (
                  <div className="p-4">
                    {/* Documentos do imóvel principal */}
                    {imovelPrincipal.documentos.length > 0 ? (
                      <div className="mb-4">
                        <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Documentos deste imóvel:
                        </h4>
                        <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {imovelPrincipal.documentos.map((doc) => (
                            <li key={doc.Id} className="py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {obterIconeArquivo(doc.Nome)}
                                  <div className="ml-2">
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {truncarNomeArquivo(doc.Nome)}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {doc.Tipo} - {new Date(doc.DataCriacao).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => abrirArquivoLocal(doc.Caminho)}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                    title="Abrir Arquivo"
                                  >
                                    <FileText className="h-4 w-4 text-green-500" />
                                  </button>
                                  <Link
                                    to={`/imoveis/${doc.ImovelId}`}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                    title="Ver Imóvel"
                                  >
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                  </Link>
                                  <button 
                                    onClick={() => excluirDocumento(doc.Id)}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-red-700' : 'hover:bg-red-100'}`}
                                    title="Excluir Documento"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className={`text-sm italic mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Este imóvel primário não possui documentos vinculados.
                      </p>
                    )}
                    
                    {/* Imóveis secundários */}
                    {imovelPrincipal.imoveisSecundarios.length > 0 && (
                      <div className="mt-4">
                        <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Imóveis Secundários:
                        </h4>
                        <div className="space-y-2">
                          {imovelPrincipal.imoveisSecundarios.map((imovelSecundario) => (
                            <div 
                              key={imovelSecundario.Id} 
                              className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
                            >
                              {/* Cabeçalho do imóvel secundário */}
                              <div 
                                className={`p-3 flex items-center justify-between cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                onClick={() => setImoveisExpandidos(prev => ({
                                  ...prev,
                                  [imovelSecundario.Id]: !prev[imovelSecundario.Id]
                                }))}
                              >
                                <div className="flex items-center">
                                  <Home className={`mr-2 h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                                  <div>
                                    <h5 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {imovelSecundario.Matricula}
                                    </h5>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {imovelSecundario.Localizacao} - Tipo: {imovelSecundario.TipoImovelId} (Finalidade: {imovelSecundario.FinalidadeId})
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className={`mr-2 px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                    {imovelSecundario.documentos.length} documentos
                                  </span>
                                  {imoveisExpandidos[imovelSecundario.Id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Documentos do imóvel secundário */}
                              {imoveisExpandidos[imovelSecundario.Id] && (
                                <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  {imovelSecundario.documentos.length > 0 ? (
                                    <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                      {imovelSecundario.documentos.map((doc) => (
                                        <li key={doc.Id} className="py-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                              {obterIconeArquivo(doc.Nome)}
                                              <div className="ml-2">
                                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                  {truncarNomeArquivo(doc.Nome)}
                                                </p>
                                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                  {doc.Tipo} - {new Date(doc.DataCriacao).toLocaleDateString()}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() => abrirArquivoLocal(doc.Caminho)}
                                                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                title="Abrir Arquivo"
                                              >
                                                <FileText className="h-3 w-3 text-green-500" />
                                              </button>
                                              <Link
                                                to={`/imoveis/${doc.ImovelId}`}
                                                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                                title="Ver Imóvel"
                                              >
                                                <Building2 className="h-3 w-3 text-blue-500" />
                                              </Link>
                                              <button 
                                                onClick={() => excluirDocumento(doc.Id)}
                                                className={`p-1 rounded-full ${darkMode ? 'hover:bg-red-700' : 'hover:bg-red-100'}`}
                                                title="Excluir Documento"
                                              >
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                              </button>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Este imóvel secundário não possui documentos vinculados.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // A função obterIconeArquivo já está definida acima
  
  // Contagem de documentos
  const totalDocumentos = imoveisPrincipais.reduce((total, imovel) => {
    const docsImovelPrincipal = imovel.documentos.length;
    const docsImoveisSecundarios = imovel.imoveisSecundarios.reduce(
      (subTotal, secImovel) => subTotal + secImovel.documentos.length, 0
    );
    return total + docsImovelPrincipal + docsImoveisSecundarios;
  }, 0);
  
  // Contagem de imóveis com documentos
  const totalImoveisPrincipais = imoveisPrincipais.length;
  const totalImoveisSecundarios = imoveisPrincipais.reduce(
    (total, imovel) => total + imovel.imoveisSecundarios.length, 0
  );
}
