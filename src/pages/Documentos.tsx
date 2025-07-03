import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
// Não precisamos mais de funções de mapeamento, usamos valores diretos
import { toast } from '../components/Toast';
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
  Settings,
  ShieldAlert
} from 'lucide-react';
import { isUsingMasterCredentials } from '../services/usuarioService';

// Interface para documento vinculado a imóvel
interface DocumentoVinculado {
  Id: string;
  ImovelId: string;
  Caminho: string;
  Nome: string;
  DataCriacao: string;
  Tipo: string;
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
  TipoImovel: string;
  Finalidade: string;
  documentos: DocumentoVinculado[];
}

// Interface para imóvel principal com documentos e imóveis secundários
interface ImovelPrincipal {
  Id: string;
  Matricula: string;
  Localizacao: string;
  TipoImovel: string;
  Finalidade: string;
  documentos: DocumentoVinculado[];
  imoveisSecundarios: ImovelSecundario[];
}

// Interface para o modal de confirmação de exclusão
interface ModalConfirmacaoExclusao {
  visivel: boolean;
  documentoId: string | null;
  nomeDocumento: string | null;
}

// Componente para exibir mensagem de acesso restrito
const AcessoRestrito = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 animate-fade-in">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 max-w-md w-full text-center">
        <ShieldAlert className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600 mb-6">
          Esta funcionalidade não está disponível no modo de emergência com credenciais mestras.
          Apenas as configurações do banco de dados podem ser acessadas neste modo.
        </p>
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/configuracoes')}
            className="btn btn-primary"
          >
            Ir para Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Documentos() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [documentosPrincipais, setDocumentosPrincipais] = useState<DocumentoVinculado[]>([]);
  const [documentosSecundarios, setDocumentosSecundarios] = useState<DocumentoVinculado[]>([]);
  const [imoveisPrincipais, setImoveisPrincipais] = useState<ImovelPrincipal[]>([]);
  const [imoveisPrincipaisOriginal, setImoveisPrincipaisOriginal] = useState<ImovelPrincipal[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [termoPesquisa, setTermoPesquisa] = useState<string>('');
  const [modalExclusao, setModalExclusao] = useState<ModalConfirmacaoExclusao>({
    visivel: false,
    documentoId: null,
    nomeDocumento: null
  });
  
  // Verificar se está usando credenciais mestras
  const usingMasterCredentials = isUsingMasterCredentials();
  
  // Se estiver usando credenciais mestras, mostrar mensagem de acesso restrito
  if (usingMasterCredentials) {
    return <AcessoRestrito />;
  }
  
  // Estados para os filtros
  const [filtroTipoImovel, setFiltroTipoImovel] = useState<'todos' | 'principal' | 'secundario'>('todos');
  const [filtrosAplicados, setFiltrosAplicados] = useState<boolean>(false);
  
  // Função para obter ícone com base na extensão do arquivo
  const obterIconeArquivo = (nomeArquivo: string | undefined, darkMode: boolean) => {
    if (!nomeArquivo) return <File className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase() || '';
    
    switch (extensao) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />;
      case 'pdf':
        return <FileText className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />;
      case 'doc':
      case 'docx':
        return <File className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
      case 'xls':
      case 'xlsx':
        return <Table className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />;
      case 'html':
      case 'css':
      case 'js':
        return <Code className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
      default:
        return <File className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
    }
  };
  
  // Função para truncar nomes de arquivos longos
  const truncarNomeArquivo = (nomeArquivo: string, tamanhoMaximo: number = 30) => {
    if (!nomeArquivo) return '';
    if (nomeArquivo.length <= tamanhoMaximo) return nomeArquivo;
    
    const extensao = nomeArquivo.split('.').pop() || '';
    const nome = nomeArquivo.substring(0, nomeArquivo.length - extensao.length - 1);
    
    if (nome.length <= tamanhoMaximo - 3 - extensao.length) {
      return nomeArquivo;
    }
    
    return `${nome.substring(0, tamanhoMaximo - 3 - extensao.length)}...${extensao ? '.' + extensao : ''}`;
  };
  
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
    } catch (err: unknown) {
      console.error('Erro ao abrir arquivo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setErro(`Erro ao abrir arquivo: ${errorMessage}`);
      
      // Mostrar mensagem mais amigável para o usuário
      toast.error(`Não foi possível abrir o arquivo. Verifique se o caminho existe e se você tem permissão para acessá-lo.\n\nCaminho: ${caminho}`, 8000);
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
      
      // Separar documentos por tipo de imóvel
      // Nota: TipoImovel pode conter valores como 'Casa', 'Apartamento', etc. em vez de 'Principal'/'Secundário'
      // Consideramos todos os documentos como principais por enquanto
      const principais = documentos;
      const secundarios: DocumentoVinculado[] = [];
      
      setDocumentosPrincipais(principais);
      setDocumentosSecundarios(secundarios);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setErro('Erro ao carregar documentos. Verifique se o servidor está em execução.');
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para abrir o modal de confirmação de exclusão
  const abrirModalExclusao = (documentoId: string, nomeDocumento: string) => {
    setModalExclusao({
      visivel: true,
      documentoId,
      nomeDocumento
    });
  };
  
  // Função para fechar o modal de confirmação de exclusão
  const fecharModalExclusao = () => {
    setModalExclusao({
      visivel: false,
      documentoId: null,
      nomeDocumento: null
    });
  };
  
  // Função para excluir um documento
  const excluirDocumento = async (documentoId: string) => {
    try {
      setCarregando(true);
      const response = await fetch(`/api/documentos/${documentoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir documento: ${response.status}`);
      }
      
      // Fechar modal e mostrar mensagem de sucesso
      fecharModalExclusao();
      toast.success('Documento excluído com sucesso!');
      
      // Recarregar documentos
      await carregarDocumentosVinculados();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      setErro('Erro ao excluir documento. Verifique se o servidor está em execução.');
      toast.error('Erro ao excluir documento');
      fecharModalExclusao();
    } finally {
      setCarregando(false);
    }
  };
  
  // Carregar documentos ao iniciar
  useEffect(() => {
    carregarDocumentosVinculados();
  }, []);
  
  const carregarDocumentosVinculados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      console.log('Carregando lista de imóveis para identificar primários e secundários...');
      const responseImoveis = await fetch('/api/imoveis');
      
      if (!responseImoveis.ok) {
        throw new Error(`Erro ao carregar lista de imóveis: ${responseImoveis.status}`);
      }
      
      const imoveis = await responseImoveis.json();
      console.log('Lista de imóveis carregada:', imoveis.length, 'imóveis');
      
      // Exemplo do primeiro imóvel para debug
      if (imoveis.length > 0) {
        console.log('Exemplo de imóvel:', imoveis[0]);
      }
      
      // Criar um mapa de imóveis com informações sobre primário/secundário
      const mapImoveis: {[id: string]: {isPrimario: boolean, imovelPaiId?: string}} = {};
      
      // Preencher o mapa de imóveis
      imoveis.forEach((imovel: any) => {
        // Verificar diferentes possibilidades de nome do campo
        const imovelPaiId = imovel.ImovelPaiId || imovel.imovelPaiId || imovel.ImoveiPaiId || imovel.imoveiPaiId || null;
        
        mapImoveis[imovel.Id] = {
          isPrimario: !imovelPaiId || imovelPaiId === 'NULL' || imovelPaiId === null,
          imovelPaiId: imovelPaiId !== 'NULL' && imovelPaiId !== null ? imovelPaiId : undefined
        };
        
        console.log(`Imóvel ${imovel.Id} identificado como ${mapImoveis[imovel.Id].isPrimario ? 'PRIMÁRIO' : 'SECUNDÁRIO'}${mapImoveis[imovel.Id].imovelPaiId ? ` (pai: ${mapImoveis[imovel.Id].imovelPaiId})` : ''}`);
      });
      
      // 2. Agora, carregar os documentos vinculados
      const response = await fetch('/api/documentos/todos-vinculados');
      if (!response.ok) {
        throw new Error(`Erro ao carregar documentos vinculados: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados de documentos recebidos da API:', data);
      
      // 3. Processar os dados e criar estruturas para imóveis primários e secundários
      const imoveisPrimarios: ImovelPrincipal[] = [];
      const imoveisSecundarios: {[imovelPaiId: string]: ImovelSecundario[]} = {};
      const todosImoveis: {[id: string]: any} = {};
      
      // Primeiro passo: criar estrutura base para todos os imóveis
      imoveis.forEach((imovel: any) => {
        const imovelInfo = mapImoveis[imovel.Id];
        
        if (!imovelInfo) {
          console.warn(`Imóvel ${imovel.Id} não encontrado no mapa`);
          return;
        }
        
        // Criar objeto base do imóvel com seus campos
        const imovelObj = {
          Id: imovel.Id,
          ImovelId: imovel.Id, // Garantir que temos ImovelId para compatibilidade
          Matricula: imovel.Matricula || 'Sem matrícula',
          Localizacao: imovel.Localizacao || 'Localização não informada',
          TipoImovel: imovel.TipoImovel || 'Não especificado',
          Finalidade: imovel.Finalidade || 'Não especificada',
          documentos: []
        };
        
        todosImoveis[imovel.Id] = imovelObj;
        
        if (imovelInfo.isPrimario) {
          // É um imóvel primário
          imoveisPrimarios.push({
            ...imovelObj,
            imoveisSecundarios: []
          });
        } else if (imovelInfo.imovelPaiId) {
          // É um imóvel secundário
          if (!imoveisSecundarios[imovelInfo.imovelPaiId]) {
            imoveisSecundarios[imovelInfo.imovelPaiId] = [];
          }
          imoveisSecundarios[imovelInfo.imovelPaiId].push(imovelObj);
        }
      });
      
      // Segundo passo: associar documentos aos imóveis
      data.forEach((item: any) => {
        if (item.Caminho && item.Nome && item.ImovelId) {
          const doc: DocumentoVinculado = {
            Id: item.Id,
            ImovelId: item.ImovelId,
            Caminho: item.Caminho || '',
            Nome: item.Nome || 'Documento sem nome',
            DataCriacao: item.DataCriacao || new Date().toISOString(),
            Tipo: item.Tipo || 'Não especificado'
          };
          
          // Verificar se o imóvel existe no nosso mapa
          if (todosImoveis[item.ImovelId]) {
            todosImoveis[item.ImovelId].documentos.push(doc);
          }
        }
      });
      
      // Terceiro passo: associar imóveis secundários aos seus primários
      imoveisPrimarios.forEach((imovelPrimario: ImovelPrincipal) => {
        // Filtrar apenas imóveis secundários que têm documentos
        const secundariosComDocumentos = (imoveisSecundarios[imovelPrimario.Id] || []).filter(secundario => 
          secundario.documentos && secundario.documentos.length > 0
        );
        imovelPrimario.imoveisSecundarios = secundariosComDocumentos;
        console.log(`Imóvel primário ${imovelPrimario.Id} tem ${imovelPrimario.imoveisSecundarios.length} imóveis secundários com documentos`);
      });
      
      // Inicializar o estado de expansão para todos os imóveis
      const estadoExpansao: {[key: string]: boolean} = {};
      imoveisPrimarios.forEach((imovel: ImovelPrincipal) => {
        estadoExpansao[imovel.Id] = true; // Expandir por padrão
        
        // Também inicializar para imóveis secundários
        imovel.imoveisSecundarios.forEach((secundario: ImovelSecundario) => {
          estadoExpansao[secundario.Id] = true; // Expandir por padrão
        });
      });
      
      setImoveisExpandidos(estadoExpansao);
      
      // Filtrar apenas imóveis primários que têm documentos ou imóveis secundários com documentos
      const imoveisPrimariosComDocumentos = imoveisPrimarios.filter(imovel => 
        (imovel.documentos && imovel.documentos.length > 0) || 
        (imovel.imoveisSecundarios && imovel.imoveisSecundarios.length > 0)
      );
      
      console.log('Imóveis primários com documentos:', imoveisPrimariosComDocumentos.length);
      
      setImoveisPrincipais(imoveisPrimariosComDocumentos);
      setImoveisPrincipaisOriginal(imoveisPrimariosComDocumentos);
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
      
      // Garantir que apenas imóveis com documentos sejam exibidos
      const imoveisFiltradosComDocumentos = imoveisFiltrados.filter((imovel: ImovelPrincipal) => 
        (imovel.documentos && imovel.documentos.length > 0) || 
        (imovel.imoveisSecundarios && imovel.imoveisSecundarios.some((sec: ImovelSecundario) => sec.documentos && sec.documentos.length > 0))
      );
      
      // Atualizar o estado com os imóveis filtrados
      setImoveisPrincipais(imoveisFiltradosComDocumentos);
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
      })
      // Filtrar apenas imóveis que têm documentos (principais ou secundários)
      .filter(imovel => imovel.documentos.length > 0 || imovel.imoveisSecundarios.length > 0);
      
      setImoveisPrincipais(imoveisFiltrados);
    } catch (err) {
      console.error('Erro ao pesquisar documentos:', err);
      setErro('Erro ao pesquisar documentos. Verifique se o servidor está em execução.');
    } finally {
      setCarregando(false);
    }
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
                        {imovelPrincipal.Localizacao} - Tipo: {imovelPrincipal.TipoImovel} (Finalidade: {imovelPrincipal.Finalidade})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                      {(imovelPrincipal.documentos && Array.isArray(imovelPrincipal.documentos) ? imovelPrincipal.documentos.length : 0)} documentos
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
                    {/* Debug para verificar o conteúdo de documentos */}
                    <div className="text-xs text-gray-500 mb-2">
                      {/* Movido o console.log para fora do JSX para evitar erro de tipo */}
                      {(() => {
                        console.log('Documentos do imóvel:', imovelPrincipal.Id, imovelPrincipal.documentos);
                        return null;
                      })()}
                    </div>
                    {(imovelPrincipal.documentos && Array.isArray(imovelPrincipal.documentos) && imovelPrincipal.documentos.length > 0) ? (
                      <div className="mb-4">
                        <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Documentos deste imóvel:
                        </h4>
                        <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {imovelPrincipal.documentos && Array.isArray(imovelPrincipal.documentos) && imovelPrincipal.documentos.map((doc) => (
                            <li key={doc.Id} className="py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {obterIconeArquivo(doc.Nome || '', darkMode)}
                                  <div className="ml-2">
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {truncarNomeArquivo(doc.Nome || '')}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {(doc.Nome || '').split('.').pop()} - {new Date(doc.DataCriacao || '').toLocaleDateString()}
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
                                    onClick={() => abrirModalExclusao(doc.Id, doc.Nome || 'Documento')}
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
                    {imovelPrincipal.imoveisSecundarios && Array.isArray(imovelPrincipal.imoveisSecundarios) && imovelPrincipal.imoveisSecundarios.length > 0 && (
                      <div className="mt-4">
                        <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Imóveis Secundários:
                        </h4>
                        <div className="space-y-2">
                          {imovelPrincipal.imoveisSecundarios && Array.isArray(imovelPrincipal.imoveisSecundarios) && imovelPrincipal.imoveisSecundarios.map((imovelSecundario) => (
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
                                      {imovelSecundario.Localizacao} - Tipo: {imovelSecundario.TipoImovel} (Finalidade: {imovelSecundario.Finalidade})
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
                                              {obterIconeArquivo(doc.Nome, darkMode)}
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
                                                onClick={() => abrirModalExclusao(doc.Id, doc.Nome || 'Documento')}
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
      
      {/* Modal de confirmação de exclusão */}
      {modalExclusao.visivel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-lg max-w-md w-full p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Confirmar Exclusão</h3>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Tem certeza que deseja excluir este documento?
                <span className="block font-medium mt-1 break-all">
                  {modalExclusao.nomeDocumento && truncarNomeArquivo(modalExclusao.nomeDocumento, 40)}
                </span>
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={fecharModalExclusao}
                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancelar
              </button>
              <button
                onClick={() => modalExclusao.documentoId && excluirDocumento(modalExclusao.documentoId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={carregando}
              >
                {carregando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Excluindo...
                  </>
                ) : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  
  // Contagem de imóveis com documentos (comentado para evitar warnings de variáveis não utilizadas)
  // Estas variáveis podem ser usadas no futuro para exibir estatísticas
  // const totalImoveisPrincipais = imoveisPrincipais.length;
  // const totalImoveisSecundarios = imoveisPrincipais.reduce(
  //   (total, imovel) => total + (imovel.imoveisSecundarios?.length || 0), 0
  // );
}
