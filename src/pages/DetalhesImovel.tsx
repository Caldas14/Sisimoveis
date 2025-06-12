import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Edit, ChevronRight, 
  Trash2, FileDown, Plus, Upload, File, ExternalLink, Loader2,
  Check, X, AlertTriangle, AlertCircle
} from 'lucide-react';
import { formatarData, formatarArea, downloadCSV } from '../lib/utils';
import { Imovel, Documento } from '../types/imovel';
import DocumentosImovel from '../components/DocumentosImovel';

export default function DetalhesImovel() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'detalhes' | 'documentos' | 'secundarios'>('detalhes');
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [imoveisSecundarios, setImoveisSecundarios] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imovelParaExcluir, setImovelParaExcluir] = useState<boolean>(false);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagemExclusao, setMensagemExclusao] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);
  const [contagemDocumentos, setContagemDocumentos] = useState<number>(0);
  
  // Definir a função global para atualizar a contagem de documentos
  useEffect(() => {
    // Definir a função global para atualizar a contagem de documentos
    window.atualizarContagemDocumentos = (quantidade: number) => {
      setContagemDocumentos(quantidade);
    };
    
    // Limpar a função global quando o componente for desmontado
    return () => {
      delete window.atualizarContagemDocumentos;
    };
  }, []);
  
  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      
      // Verificar se o ID é válido (não é 'cadastro' ou outro valor não numérico)
      if (id === 'cadastro') {
        console.log('Rota de cadastro detectada, não carregando dados de imóvel');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Carregando dados do imóvel com ID:', id);
        
        // Importar o serviço de imóveis de forma dinâmica para evitar problemas com SSR
        const { obterImovelPorId, buscarImoveisSecundarios } = await import('../services/imovelService');
        
        // Carregar dados do imóvel
        const imovelData = await obterImovelPorId(id);
        console.log('Dados do imóvel carregados com sucesso:', imovelData);
        console.log('MatriculasOriginadas:', imovelData.matriculasOriginadas);
        console.log('DEBUG - usuarioCadastroNome:', imovelData.usuarioCadastroNome);
        console.log('DEBUG - Todos os campos do imóvel:', Object.keys(imovelData));
        setImovel(imovelData);
        
        // Carregar imóveis secundários se for um imóvel principal
        if (imovelData && imovelData.imovelPaiId === null) {
          console.log('Carregando imóveis secundários para o imóvel principal:', id);
          const secundarios = await buscarImoveisSecundarios(id);
          console.log('Imóveis secundários carregados:', secundarios.length);
          setImoveisSecundarios(secundarios);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do imóvel:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do imóvel');
      } finally {
        setLoading(false);
      }
    }
    
    carregarDados();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Carregando informações do imóvel...</p>
      </div>
    );
  }
  
  if (error || !imovel) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Imóvel não encontrado</h2>
        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {error || 'O imóvel que você está procurando não existe ou foi removido.'}
        </p>
        <Link to="/imoveis" className={`mt-4 btn ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'btn-primary'}`}>
          Voltar para Lista de Imóveis
        </Link>
      </div>
    );
  }
  
  // Função para excluir o imóvel (principal ou secundário)
  async function excluirImovelPrincipal() {
    if (!id) return;
    
    try {
      setExcluindo(true);
      setMensagemExclusao(null);
      
      console.log('Excluindo imóvel principal com ID:', id, 'e todos os seus secundários');
      
      // Importar o serviço de imóveis
      const { excluirImovel } = await import('../services/imovelService');
      
      // Excluir o imóvel principal com a opção de cascata
      await excluirImovel(id, true);
      
      // Mostrar mensagem de sucesso
      setMensagemExclusao({
        tipo: 'sucesso',
        texto: `Imóvel principal e ${imoveisSecundarios.length} imóveis secundários excluídos com sucesso!`
      });
      
      // Resetar o estado do modal
      setImovelParaExcluir(false);
      
      // Redirecionar para a lista de imóveis após 2 segundos
      setTimeout(() => {
        navigate('/imoveis');
      }, 2000);
    } catch (err) {
      console.error('Erro ao excluir imóvel principal:', err);
      
      // Mostrar mensagem de erro
      setMensagemExclusao({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao excluir imóvel principal'
      });
    } finally {
      setExcluindo(false);
    }
  }
  
  // Preparar dados para exportação CSV
  const exportarParaCSV = () => {
    const dadosParaExportar = [imovel, ...imoveisSecundarios].map(i => ({
      Matrícula: i.matricula,
      Localização: i.localizacao,
      'Área (m²)': i.area,
      Objeto: i.objeto,
      Finalidade: i.finalidade,
      'Tipo de Imóvel': i.tipoImovel,
      'Status de Transferência': i.statusTransferencia,
      'Tipo de Posse': i.tipoPosse,
      'Tipo de Uso': i.tipoUsoEdificacao,
      'Valor Venal': i.valorVenal,
      'Registro IPTU': i.registroIPTU,
      'Ponto de Referência': i.pontoReferencia,
      'Latitude': i.latitude,
      'Longitude': i.longitude,
      'Água': i.infraestrutura?.agua ? 'Sim' : 'Não',
      'Esgoto': i.infraestrutura?.esgoto ? 'Sim' : 'Não',
      'Energia': i.infraestrutura?.energia ? 'Sim' : 'Não',
      'Pavimentação': i.infraestrutura?.pavimentacao ? 'Sim' : 'Não',
      'Iluminação': i.infraestrutura?.iluminacao ? 'Sim' : 'Não',
      'Coleta de Lixo': i.infraestrutura?.coletaLixo ? 'Sim' : 'Não',
      'Imóvel Principal': i.imovelPaiId === null ? 'Sim' : 'Não'
    }));
    
    downloadCSV(dadosParaExportar, `imovel-${imovel.matricula}.csv`);
  };
  
  return (
    <div className={`space-y-6 animate-fade-in p-6 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mensagem de exclusão */}
      {mensagemExclusao && (
        <div className={`mb-4 rounded-md p-4 ${mensagemExclusao.tipo === 'sucesso' ? (darkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-800') : (darkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800')}`}>
          {mensagemExclusao.texto}
        </div>
      )}
      
      {/* Modal de confirmação de exclusão do imóvel principal */}
      {imovelParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className={`w-full max-w-md rounded-lg p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-6 w-6 text-yellow-500" />
              <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-100' : ''}`}>Confirmar exclusão</h3>
            </div>
            
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Tem certeza que deseja excluir o imóvel <strong>{imovel.matricula}</strong> - {imovel.objeto}?
              <br />
              {imovel.imovelPaiId === null && imoveisSecundarios.length > 0 && (
                <span className={`mt-2 block text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  Esta ação também excluirá {imoveisSecundarios.length} imóvel(is) secundário(s) associado(s) a este imóvel principal.
                </span>
              )}
              <span className={`mt-2 block text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                Esta ação não pode ser desfeita.
              </span>
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className={`rounded-md border px-4 py-2 text-sm font-medium shadow-sm ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setImovelParaExcluir(false)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={excluirImovelPrincipal}
                disabled={excluindo}
              >
                {excluindo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {imovel.imovelPaiId === null && imoveisSecundarios.length > 0 ? 'Excluir Todos' : 'Excluir'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cabeçalho */}
      <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? 'bg-gray-900 border-blue-900' : 'bg-white border-blue-100'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-x-2 text-xs">
              <Link to="/imoveis" className="text-blue-500 hover:text-blue-700 font-medium">
                Imóveis
              </Link>
              <ChevronRight className="h-4 w-4 text-blue-300" />
              {imovel.imovelPaiId && (
                <>
                  <Link 
                    to={`/imoveis/${imovel.imovelPaiId}`} 
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Imóvel Principal
                  </Link>
                  <ChevronRight className="h-4 w-4 text-blue-300" />
                </>
              )}
              <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>{imovel.matricula}</span>
            </div>
            <h1 className={`mt-2 text-3xl font-bold border-b pb-2 ${darkMode ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-200'}`}>{imovel.objeto}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                imovel.imovelPaiId === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {imovel.imovelPaiId === null ? 'Imóvel Principal' : 'Imóvel Secundário'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                imovel.statusTransferencia === 'Transferido'
                  ? 'bg-green-500 text-white'
                  : imovel.statusTransferencia === 'Em processo'
                  ? 'bg-yellow-500 text-white'
                  : imovel.statusTransferencia === 'Cancelado'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}>
                {imovel.statusTransferencia}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>
                {imovel.tipoImovel}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                {imovel.finalidade}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={exportarParaCSV}
              className={`px-4 py-2 border rounded-lg shadow-sm transition-colors duration-200 flex items-center ${darkMode ? 'bg-gray-900 text-blue-400 border-blue-900 hover:bg-gray-800' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar CSV
            </button>
            
            <Link to={`/imoveis/${id}/editar`} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
            
            {/* Botão de exclusão para qualquer tipo de imóvel */}
            <button 
              onClick={() => setImovelParaExcluir(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors duration-200 flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Imóvel
            </button>
          </div>
        </div>
      </div>
      
      {/* Navegação em tabs */}
      <div className={`rounded-xl shadow-sm mb-6 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <nav className="flex">
          <button
            className={`
              py-4 px-6 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'detalhes'
                  ? `${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'} font-semibold`
                  : `${darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            `}
            onClick={() => setActiveTab('detalhes')}
          >
            Detalhes
            {activeTab === 'detalhes' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></span>
            )}
          </button>
          <button
            className={`
              py-4 px-6 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'documentos'
                  ? `${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'} font-semibold`
                  : `${darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            `}
            onClick={() => setActiveTab('documentos')}
          >
            Documentos
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
              {contagemDocumentos || 0}
            </span>
            {activeTab === 'documentos' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></span>
            )}
          </button>
          {imovel.imovelPaiId === null && (
            <button
              className={`
                py-4 px-6 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'secundarios'
                    ? `${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'} font-semibold`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                }
              `}
              onClick={() => setActiveTab('secundarios')}
            >
              Imóveis Secundários
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                {imoveisSecundarios.length}
              </span>
              {activeTab === 'secundarios' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></span>
              )}
            </button>
          )}
        </nav>
      </div>
      
      {/* Conteúdo da tab selecionada */}
      <div>
        {activeTab === 'detalhes' && imovel && (
          <DetalhesTab imovel={imovel} imoveisSecundarios={imoveisSecundarios} />
        )}
        
        {activeTab === 'documentos' && imovel && (
          <DocumentosTab imovel={imovel} />
        )}
        
        {activeTab === 'secundarios' && imovel && imovel.imovelPaiId === null && (
          <SecundariosTab 
            imovelPrincipal={imovel} 
            imoveisSecundarios={imoveisSecundarios} 
          />
        )}
      </div>
    </div>
  );
}

function DetalhesTab({ imovel, imoveisSecundarios = [] }: { imovel: Imovel, imoveisSecundarios?: Imovel[] }) {
  // Acessar o contexto de tema
  const { darkMode } = useTheme();
  
  // Verificar se é imóvel principal
  const ehImovelPrincipal = !imovel.imovelPaiId;
  
  // Usar os valores calculados da API
  const areaDesmembradaTotal = imovel.areaDesmembrada;
  const areaRemanescente = imovel.areaRemanescente;
  const percentualDesmembrado = imovel.percentualDesmembrado;
  
  // Verificar se há inconsistência na área
  const temInconsistenciaArea = ehImovelPrincipal && areaDesmembradaTotal > imovel.area;
  
  // Depurar os valores de infraestrutura
  console.log('Valores originais de infraestrutura:', imovel.infraestrutura);
  
  // Usar diretamente os valores de infraestrutura do objeto imovel
  // Esses valores já foram convertidos para booleanos no serviço imovelService.ts
  const infraestrutura = imovel.infraestrutura || {
    agua: false,
    esgoto: false,
    energia: false,
    pavimentacao: false,
    iluminacao: false,
    coletaLixo: false
  };
  
  console.log('Valores de infraestrutura usados:', infraestrutura);
  // Informações básicas do imóvel
  const infoBasicas = [
    { label: 'Matrícula', value: imovel.matricula },
    { label: 'Localização', value: imovel.localizacao },
    { label: 'Área', value: formatarArea(imovel.area) },
    { label: 'Finalidade', value: imovel.finalidade },
    { label: 'Tipo do Imóvel', value: imovel.tipoImovel },
    { label: 'Status de Transferência', value: imovel.statusTransferencia },
    { label: 'Tipo de Posse', value: imovel.tipoPosse },
    { label: 'Tipo de Uso da Edificação', value: imovel.tipoUsoEdificacao },
    { label: 'Valor Venal', value: imovel.valorVenal ? `R$ ${imovel.valorVenal.toLocaleString('pt-BR')}` : 'Não informado' },
    { label: 'Registro IPTU', value: imovel.registroIPTU || 'Não informado' },
    { 
      label: 'Imóvel Principal', 
      value: imovel.imovelPaiId ? 'Imóvel Secundário' : 'Imóvel Principal'
    },
    { 
      label: 'Matrículas Originadas', 
      value: imovel.matriculasOriginadas && imovel.matriculasOriginadas.trim().length > 0 
        ? imovel.matriculasOriginadas 
        : 'Não possui' 
    },
    {
      label: 'Data de Cadastro',
      value: imovel.dataCadastro ? formatarData(imovel.dataCadastro) : 'Não informado'
    },
    {
      label: 'Cadastrado por',
      value: imovel.usuarioCadastroNome || 'Não informado'
    },
    // Adicionar campos de área desmembrada e área remanescente apenas para imóveis principais
    ...(ehImovelPrincipal ? [
      { 
        label: 'Área Desmembrada Total', 
        value: formatarArea(areaDesmembradaTotal),
        highlight: temInconsistenciaArea ? 'warning' : undefined
      },
      { 
        label: 'Área Remanescente', 
        value: formatarArea(areaRemanescente),
        highlight: temInconsistenciaArea ? 'warning' : undefined
      }
    ] : []),
  ];

  // Informações de localização
  const infoLocalizacao = [
    { label: 'Ponto de Referência', value: imovel.pontoReferencia || 'Não informado' },
    { 
      label: 'Coordenadas', 
      value: imovel.latitude && imovel.longitude ? 
        `${imovel.latitude}, ${imovel.longitude}` : 
        'Não informadas' 
    },
  ];

  // Informações de datas
  const infoDatas = [
    { 
      label: 'Data de Cadastro', 
      value: formatarData(imovel.dataCadastro) 
    },
    { 
      label: 'Última Atualização', 
      value: formatarData(imovel.dataAtualizacao) 
    }
  ];
  
  return (
    <div className="space-y-8">
      {/* Informações básicas */}
      <div className={`rounded-xl shadow-sm p-6 border-t-4 border-blue-500 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 pb-2 border-b flex items-center ${darkMode ? 'text-blue-300 border-gray-700' : 'text-blue-800 border-gray-100'}`}>
          <Building2 className="h-5 w-5 mr-2 text-blue-500" />
          Informações Básicas
        </h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {infoBasicas.map((item, index) => (
            <div key={index} className={`p-3 rounded-lg transition-colors duration-200 ${item.highlight === 'warning' ? (darkMode ? 'bg-yellow-900/30 hover:bg-yellow-900/50' : 'bg-yellow-50 hover:bg-yellow-100') : (darkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-50')}`}>
              <p className={`text-sm font-medium ${item.highlight === 'warning' ? (darkMode ? 'text-yellow-400' : 'text-yellow-700') : (darkMode ? 'text-blue-400' : 'text-blue-700')}`}>{item.label}</p>
              <p className={`text-sm font-semibold ${item.highlight === 'warning' ? (darkMode ? 'text-yellow-300' : 'text-yellow-800') : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>{item.value}</p>
              {item.highlight === 'warning' && (
                <p className={`mt-1 text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  Atenção: Inconsistência detectada. A área desmembrada total excede a área do imóvel principal.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Objeto e Observação */}
      <div className={`rounded-xl shadow-sm p-6 border-t-4 border-indigo-500 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 pb-2 border-b flex items-center ${darkMode ? 'text-indigo-300 border-gray-700' : 'text-indigo-800 border-gray-100'}`}>
          <File className="h-5 w-5 mr-2 text-indigo-500" />
          Descrição
        </h3>
        <div className="space-y-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
            <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Objeto</p>
            <p className={`text-sm font-semibold p-3 rounded border ${darkMode ? 'text-gray-200 bg-gray-700 border-indigo-900/50' : 'text-gray-800 bg-white border-indigo-100'}`}>{imovel.objeto}</p>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Observação</p>
            <p className={`text-sm p-3 rounded border whitespace-pre-line ${darkMode ? 'text-gray-200 bg-gray-700 border-gray-600' : 'text-gray-800 bg-white border-gray-200'}`}>
              {imovel.observacao || 'Nenhuma observação.'}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo de Áreas - Apenas para imóveis principais */}
      {ehImovelPrincipal && (
        <div className={`rounded-xl shadow-sm p-6 border-t-4 ${temInconsistenciaArea ? 'border-yellow-500' : 'border-green-500'} ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 pb-2 border-b flex items-center ${temInconsistenciaArea ? (darkMode ? 'text-yellow-400' : 'text-yellow-800') : (darkMode ? 'text-green-400' : 'text-green-800')} ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <File className={`h-5 w-5 mr-2 ${temInconsistenciaArea ? 'text-yellow-500' : 'text-green-500'}`} />
            Resumo de Áreas {temInconsistenciaArea && '(Inconsistência Detectada)'}
          </h3>
          
          <div className="space-y-4">
            {/* Barra de progresso */}
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Área Desmembrada</span>
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{percentualDesmembrado}%</span>
              </div>
              <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2.5 rounded-full ${temInconsistenciaArea ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${percentualDesmembrado}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Área Total do Imóvel</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatarArea(imovel.area)}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${temInconsistenciaArea ? (darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50') : (darkMode ? 'bg-blue-900/30' : 'bg-blue-50')}`}>
                <p className={`text-sm font-medium mb-1 ${temInconsistenciaArea ? (darkMode ? 'text-yellow-400' : 'text-yellow-700') : (darkMode ? 'text-blue-400' : 'text-blue-700')}`}>Área Desmembrada Total</p>
                <p className={`text-lg font-bold ${temInconsistenciaArea ? (darkMode ? 'text-yellow-300' : 'text-yellow-900') : (darkMode ? 'text-blue-300' : 'text-blue-900')}`}>{formatarArea(areaDesmembradaTotal)}</p>
                {temInconsistenciaArea && (
                  <p className={`mt-1 text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    Atenção: A área desmembrada excede a área total do imóvel.
                  </p>
                )}
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Área Remanescente</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-green-300' : 'text-green-900'}`}>{formatarArea(areaRemanescente)}</p>
              </div>
            </div>
            
            {temInconsistenciaArea && (
              <div className={`border-l-4 border-yellow-400 p-4 rounded-lg mt-4 ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      <strong>Inconsistência detectada:</strong> A soma das áreas dos imóveis secundários ({formatarArea(areaDesmembradaTotal)}) é maior que a área do imóvel principal ({formatarArea(imovel.area)}).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Infraestrutura */}
      <div className={`card p-6 rounded-xl shadow-sm ${darkMode ? 'bg-gray-900 border-t-4 border-green-700' : 'bg-gradient-to-br from-green-50 to-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 border-b pb-2 ${darkMode ? 'text-green-400 border-green-800' : 'text-green-800 border-green-200'}`}>Infraestrutura Disponível</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={`flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 ${infraestrutura.agua ? (darkMode ? 'bg-green-900/30 border-l-4 border-green-500 hover:shadow-md' : 'bg-green-100 border-l-4 border-green-500 hover:shadow-md') : (darkMode ? 'bg-red-900/30 border-l-4 border-red-500 hover:shadow-md' : 'bg-red-100 border-l-4 border-red-500 hover:shadow-md')}`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${infraestrutura.agua ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} mr-3`}>
              {infraestrutura.agua ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : ''}`}>Água</span>
              <span className={`text-xs ${infraestrutura.agua ? (darkMode ? 'text-green-400' : 'text-green-700') : (darkMode ? 'text-red-400' : 'text-red-700')}`}>
                {infraestrutura.agua ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            {infraestrutura.agua && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <Check className="h-3 w-3 mr-1" />
                Sim
              </span>
            )}
          </div>

          <div className={`flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 ${infraestrutura.esgoto ? (darkMode ? 'bg-green-900/30' : 'bg-green-100') : (darkMode ? 'bg-red-900/30' : 'bg-red-100')} border-l-4 ${infraestrutura.esgoto ? 'border-green-500' : 'border-red-500'} hover:shadow-md`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${infraestrutura.esgoto ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} mr-3`}>
              {infraestrutura.esgoto ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="block text-sm font-semibold">Esgoto</span>
              <span className={`text-xs ${infraestrutura.esgoto ? 'text-green-700' : 'text-red-700'}`}>
                {infraestrutura.esgoto ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            {infraestrutura.esgoto && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <Check className="h-3 w-3 mr-1" />
                Sim
              </span>
            )}
          </div>

          <div className={`flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 ${infraestrutura.energia ? (darkMode ? 'bg-green-900/30' : 'bg-green-100') : (darkMode ? 'bg-red-900/30' : 'bg-red-100')} border-l-4 ${infraestrutura.energia ? 'border-green-500' : 'border-red-500'} hover:shadow-md`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${infraestrutura.energia ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} mr-3`}>
              {infraestrutura.energia ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="block text-sm font-semibold">Energia</span>
              <span className={`text-xs ${infraestrutura.energia ? 'text-green-700' : 'text-red-700'}`}>
                {infraestrutura.energia ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            {infraestrutura.energia && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <Check className="h-3 w-3 mr-1" />
                Sim
              </span>
            )}
          </div>

          <div className={`flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 ${infraestrutura.pavimentacao ? (darkMode ? 'bg-green-900/30' : 'bg-green-100') : (darkMode ? 'bg-red-900/30' : 'bg-red-100')} border-l-4 ${infraestrutura.pavimentacao ? 'border-green-500' : 'border-red-500'} hover:shadow-md`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${infraestrutura.pavimentacao ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} mr-3`}>
              {infraestrutura.pavimentacao ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="block text-sm font-semibold">Pavimentação</span>
              <span className={`text-xs ${infraestrutura.pavimentacao ? 'text-green-700' : 'text-red-700'}`}>
                {infraestrutura.pavimentacao ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            {infraestrutura.pavimentacao && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <Check className="h-3 w-3 mr-1" />
                Sim
              </span>
            )}
          </div>

          <div className={`flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 ${infraestrutura.iluminacao ? (darkMode ? 'bg-green-900/30' : 'bg-green-100') : (darkMode ? 'bg-red-900/30' : 'bg-red-100')} border-l-4 ${infraestrutura.iluminacao ? 'border-green-500' : 'border-red-500'} hover:shadow-md`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${infraestrutura.iluminacao ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} mr-3`}>
              {infraestrutura.iluminacao ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="block text-sm font-semibold">Iluminação</span>
              <span className={`text-xs ${infraestrutura.iluminacao ? 'text-green-700' : 'text-red-700'}`}>
                {infraestrutura.iluminacao ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            {infraestrutura.iluminacao && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <Check className="h-3 w-3 mr-1" />
                Sim
              </span>
            )}
          </div>

          <div className={`flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 ${infraestrutura.coletaLixo ? (darkMode ? 'bg-green-900/30' : 'bg-green-100') : (darkMode ? 'bg-red-900/30' : 'bg-red-100')} border-l-4 ${infraestrutura.coletaLixo ? 'border-green-500' : 'border-red-500'} hover:shadow-md`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${infraestrutura.coletaLixo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} mr-3`}>
              {infraestrutura.coletaLixo ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="block text-sm font-semibold">Coleta de Lixo</span>
              <span className={`text-xs ${infraestrutura.coletaLixo ? 'text-green-700' : 'text-red-700'}`}>
                {infraestrutura.coletaLixo ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            {infraestrutura.coletaLixo && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <Check className="h-3 w-3 mr-1" />
                Sim
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Localização */}
      <div className={`rounded-xl shadow-sm p-6 border-t-4 border-green-500 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 pb-2 border-b flex items-center ${darkMode ? 'text-green-300 border-gray-700' : 'text-green-800 border-gray-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Localização
        </h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {infoLocalizacao.map((item, index) => (
            <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</p>
              <p className={`text-sm font-semibold p-2 rounded border ${darkMode ? 'text-gray-200 bg-gray-600 border-gray-500' : 'text-gray-800 bg-white border-gray-200'}`}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Endereço completo: <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{imovel.localizacao}</span></p>
        </div>
      </div>

      {/* Datas */}
      <div className={`rounded-xl shadow-sm p-6 border-t-4 border-purple-500 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 pb-2 border-b flex items-center ${darkMode ? 'text-purple-300 border-gray-700' : 'text-purple-800 border-gray-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Datas
        </h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {infoDatas.map((item, index) => (
            <div key={index} className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 ${darkMode ? 'bg-purple-900' : 'bg-purple-200'}`}>
                <span className={`text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                  {item.value && !isNaN(new Date(item.value).getTime()) ? new Date(item.value).getDate() : '-'}
                </span>
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>{item.label}</p>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentosTab({ imovel }: { imovel: Imovel }) {
  const { darkMode } = useTheme();
  const [imoveisSecundarios, setImoveisSecundarios] = useState<Imovel[]>([]);
  const [carregandoSecundarios, setCarregandoSecundarios] = useState(false);
  const [totalDocumentos, setTotalDocumentos] = useState(0);
  const [documentosPorImovel, setDocumentosPorImovel] = useState<Record<string, number>>({});
  const [mostrarDocumentosSecundarios, setMostrarDocumentosSecundarios] = useState<Record<string, boolean>>({});
  
  // Carregar imóveis secundários se for um imóvel principal
  useEffect(() => {
    async function carregarImoveisSecundarios() {
      if (imovel && imovel.id && imovel.imovelPaiId === null) {
        try {
          setCarregandoSecundarios(true);
          const { buscarImoveisSecundarios } = await import('../services/imovelService');
          const secundarios = await buscarImoveisSecundarios(imovel.id);
          console.log('Imóveis secundários carregados na aba Documentos:', secundarios.length);
          setImoveisSecundarios(secundarios);
        } catch (err) {
          console.error('Erro ao carregar imóveis secundários:', err);
        } finally {
          setCarregandoSecundarios(false);
        }
      }
    }
    
    carregarImoveisSecundarios();
  }, [imovel]);
  
  // Função para alternar a exibição dos documentos de um imóvel secundário
  const toggleDocumentosSecundario = (imovelId: string) => {
    setMostrarDocumentosSecundarios(prev => ({
      ...prev,
      [imovelId]: !prev[imovelId]
    }));
  };
  
  // Atualizar contagem de documentos do imóvel principal
  const atualizarContagemDocumentosPrincipal = (documentos: any[]) => {
    const quantidade = documentos.length;
    setDocumentosPorImovel(prev => ({ ...prev, [imovel.id]: quantidade }));
    
    // Calcular total de documentos (principal + secundários)
    const total = quantidade + Object.values(documentosPorImovel).reduce((sum, count) => {
      return sum + (count || 0);
    }, 0) - (documentosPorImovel[imovel.id] || 0); // Subtrair o valor antigo do principal
    
    setTotalDocumentos(total);
    
    // Atualizar a contagem global de documentos
    if (window.atualizarContagemDocumentos) {
      window.atualizarContagemDocumentos(total);
    }
  };
  
  // Atualizar contagem de documentos de um imóvel secundário
  const atualizarContagemDocumentosSecundario = (imovelId: string, documentos: any[]) => {
    const quantidade = documentos.length;
    setDocumentosPorImovel(prev => {
      const novoState = { ...prev, [imovelId]: quantidade };
      
      // Recalcular total
      const total = Object.values(novoState).reduce((sum, count) => sum + (count || 0), 0);
      setTotalDocumentos(total);
      
      // Atualizar contagem global
      if (window.atualizarContagemDocumentos) {
        window.atualizarContagemDocumentos(total);
      }
      
      return novoState;
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Documentos do imóvel principal */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Documentos do Imóvel Principal
          {imovel.matricula && <span className="ml-2 text-sm font-normal text-gray-500">(Matrícula: {imovel.matricula})</span>}
        </h3>
        
        {imovel && imovel.id && (
          <DocumentosImovel 
            imovelId={imovel.id} 
            onDocumentosCarregados={atualizarContagemDocumentosPrincipal}
          />
        )}
      </div>
      
      {/* Documentos dos imóveis secundários */}
      {imovel.imovelPaiId === null && imoveisSecundarios.length > 0 && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Documentos dos Imóveis Secundários ({imoveisSecundarios.length})
          </h3>
          
          {carregandoSecundarios ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Carregando imóveis secundários...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {imoveisSecundarios.map(imovelSec => (
                <div key={imovelSec.id} className={`border rounded-md ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div 
                    className={`p-3 flex justify-between items-center cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleDocumentosSecundario(imovelSec.id)}
                  >
                    <div>
                      <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {imovelSec.matricula || 'Sem matrícula'}
                      </span>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className="text-gray-500">
                        {imovelSec.objeto || 'Sem descrição'}
                      </span>
                      {documentosPorImovel[imovelSec.id] > 0 && (
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                          {documentosPorImovel[imovelSec.id]} doc(s)
                        </span>
                      )}
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${mostrarDocumentosSecundarios[imovelSec.id] ? 'rotate-90' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  
                  {mostrarDocumentosSecundarios[imovelSec.id] && (
                    <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <DocumentosImovel 
                        imovelId={imovelSec.id}
                        onDocumentosCarregados={(docs) => atualizarContagemDocumentosSecundario(imovelSec.id, docs)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SecundariosTab({ 
  imovelPrincipal, 
  imoveisSecundarios 
}: { 
  imovelPrincipal: Imovel, 
  imoveisSecundarios: Imovel[] 
}) {
  // Acessar o contexto de tema
  const { darkMode } = useTheme();
  
  const [imovelParaExcluir, setImovelParaExcluir] = useState<Imovel | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagemExclusao, setMensagemExclusao] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);
  const [imoveisSecundariosLocal, setImoveisSecundariosLocal] = useState<Imovel[]>(imoveisSecundarios);
  
  // Inicializar o estado local quando os props mudarem
  useEffect(() => {
    setImoveisSecundariosLocal(imoveisSecundarios);
  }, [imoveisSecundarios]);
  
  // Função para excluir um imóvel
  async function excluirImovel(id: string) {
    try {
      setExcluindo(true);
      setMensagemExclusao(null);
      
      console.log('Excluindo imóvel secundário com ID:', id);
      
      // Importar o serviço de imóveis
      const { excluirImovel } = await import('../services/imovelService');
      
      // Excluir o imóvel
      await excluirImovel(id);
      
      // Remover o imóvel da lista local
      setImoveisSecundariosLocal(imoveisAtuais => imoveisAtuais.filter(imovel => imovel.id !== id));
      
      // Mostrar mensagem de sucesso
      setMensagemExclusao({
        tipo: 'sucesso',
        texto: 'Imóvel secundário excluído com sucesso!'
      });
      
      // Resetar o estado do modal
      setImovelParaExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir imóvel secundário:', err);
      
      // Mostrar mensagem de erro
      setMensagemExclusao({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao excluir imóvel'
      });
    } finally {
      setExcluindo(false);
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className={`text-lg font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Hierarquia do Imóvel</h2>
        <Link to="/imoveis/cadastro" className={`btn ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'btn-primary'}`}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Imóvel Secundário
        </Link>
      </div>
      
      {/* Mensagem de exclusão */}
      {mensagemExclusao && (
        <div className={`mb-4 rounded-md p-4 ${mensagemExclusao.tipo === 'sucesso' ? (darkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-800') : (darkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800')}`}>
          {mensagemExclusao.texto}
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {imovelParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className={`w-full max-w-md rounded-lg p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-6 w-6 text-yellow-500" />
              <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-100' : ''}`}>Confirmar exclusão</h3>
            </div>
            
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Tem certeza que deseja excluir o imóvel secundário <strong>{imovelParaExcluir.matricula}</strong> - {imovelParaExcluir.objeto}?
              <br />
              <span className={`mt-2 block text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                Esta ação não pode ser desfeita.
              </span>
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className={`rounded-md border px-4 py-2 text-sm font-medium shadow-sm ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setImovelParaExcluir(null)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={() => excluirImovel(imovelParaExcluir.id)}
                disabled={excluindo}
              >
                {excluindo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`card overflow-hidden rounded-xl shadow-sm ${darkMode ? 'border border-gray-700' : ''}`}>
        <div className={`p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-primary-50 border-primary-200'}`}>
          <div className="flex items-center gap-x-4">
            <div className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-primary-100'}`}>
              <Building2 className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-primary-600'}`} />
            </div>
            <div className="min-w-0 flex-auto">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-primary-900'}`}>
                {imovelPrincipal.matricula} - {imovelPrincipal.objeto}
              </p>
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-primary-700'}`}>
                {imovelPrincipal.localizacao} • {formatarArea(imovelPrincipal.area)}
              </p>
            </div>
            <div className={`rounded-full px-2 py-1 text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-primary-100 text-primary-700'}`}>
              Principal
            </div>
          </div>
        </div>
        
        <ul role="list" className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200'}`}>
          {imoveisSecundariosLocal.length > 0 ? (
            imoveisSecundariosLocal.map((imovel) => (
              <li key={imovel.id} className={`group relative flex justify-between items-center ${darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'}`}>
                <Link to={`/imoveis/${imovel.id}`} className="flex-grow block">
                  <div className="p-4 sm:px-6">
                    <div className="flex items-center gap-x-4">
                      <div className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg ${darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                        <Building2 className={`h-6 w-6 group-hover:text-primary-600 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div className="min-w-0 flex-auto">
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {imovel.matricula} - {imovel.objeto}
                        </p>
                        <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {imovel.localizacao} • {formatarArea(imovel.area)}
                        </p>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        Secundário
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Botão de exclusão sempre visível */}
                <div className="pr-4">
                  <button 
                    type="button"
                    className={`rounded-full p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-red-900/30' : 'bg-white text-red-600 hover:bg-red-50'}`}
                    title="Excluir imóvel secundário"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImovelParaExcluir(imovel);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum imóvel secundário cadastrado.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}