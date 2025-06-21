import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Loader2, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { ImovelSecundarioInfo, ErroExclusaoComSecundarios } from '../services/imovelService';
import { formatarArea } from '../lib/utils';
import { Imovel } from '../types/imovel';
import { isUsingMasterCredentials } from '../services/usuarioService';
import ExcelExporterTodosExcelJS from '../components/ExcelExporterTodosExcelJS';

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

export default function ListaImoveis() {
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroTipoImovel, setFiltroTipoImovel] = useState<'principal' | 'secundario' | 'todos'>('principal');
  const [imovelParaExcluir, setImovelParaExcluir] = useState<Imovel | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagemExclusao, setMensagemExclusao] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);
  const [imoveisSecundarios, setImoveisSecundarios] = useState<ImovelSecundarioInfo[]>([]);
  const [modoExclusao, setModoExclusao] = useState<'normal' | 'cascata'>('normal');
  
  // Verificar se está usando credenciais mestras
  const usingMasterCredentials = isUsingMasterCredentials();
  
  // Se estiver usando credenciais mestras, mostrar mensagem de acesso restrito
  if (usingMasterCredentials) {
    return <AcessoRestrito />;
  }
  
  // Função para verificar se um imóvel tem secundários vinculados
  async function verificarImoveisSecundarios(imovel: Imovel) {
    if (imovel.imovelPaiId !== null) {
      // Se o imóvel já for secundário, não precisa verificar
      return [];
    }

    try {
      // Importar o serviço de imóveis
      const { obterImoveisSecundarios } = await import('../services/imovelService');
      
      // Buscar imóveis secundários
      const secundarios = await obterImoveisSecundarios(imovel.id);
      console.log('Imóveis secundários encontrados:', secundarios);
      
      return secundarios;
    } catch (err) {
      console.error('Erro ao verificar imóveis secundários:', err);
      return [];
    }
  }

  // Função para preparar exclusão, verificando se há imóveis secundários
  async function prepararExclusao(imovel: Imovel) {
    try {
      // Resetar estado
      setMensagemExclusao(null);
      setImoveisSecundarios([]);
      setModoExclusao('normal');
      
      // Se for imóvel principal, verificar se tem secundários
      if (imovel.imovelPaiId === null) {
        const secundarios = await verificarImoveisSecundarios(imovel);
        
        if (secundarios && secundarios.length > 0) {
          // Atualizar estado para mostrar os secundários
          setImoveisSecundarios(secundarios);
          setModoExclusao('cascata');
        }
      }
      
      // Mostrar modal de confirmação
      setImovelParaExcluir(imovel);
    } catch (err) {
      console.error('Erro ao preparar exclusão:', err);
      setMensagemExclusao({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao preparar exclusão do imóvel'
      });
    }
  }

  // Função para excluir um imóvel
  async function excluirImovel(id: string, forcarCascata: boolean = false) {
    try {
      setExcluindo(true);
      setMensagemExclusao(null);
      
      console.log('Excluindo imóvel com ID:', id, 'Forçar cascata:', forcarCascata, 'Modo:', modoExclusao);
      
      // Importar o serviço de imóveis
      const { excluirImovel } = await import('../services/imovelService');
      
      // Excluir o imóvel (com ou sem cascata)
      const excluirEmCascata = forcarCascata || modoExclusao === 'cascata';
      await excluirImovel(id, excluirEmCascata);
      
      // Atualizar a lista de imóveis (remover o imóvel excluído e seus secundários, se aplicável)
      if (excluirEmCascata && imoveisSecundarios.length > 0) {
        // Remover o imóvel principal e todos os secundários
        const idsParaRemover = [id, ...imoveisSecundarios.map(sec => sec.Id)];
        setImoveis(imoveis => imoveis.filter(imovel => !idsParaRemover.includes(imovel.id)));
        
        // Mostrar mensagem de sucesso com contagem de imóveis secundários
        setMensagemExclusao({
          tipo: 'sucesso',
          texto: `Imóvel principal e ${imoveisSecundarios.length} imóveis secundários excluídos com sucesso!`
        });
      } else {
        // Remover apenas o imóvel selecionado
        setImoveis(imoveis => imoveis.filter(imovel => imovel.id !== id));
        
        // Mostrar mensagem de sucesso
        setMensagemExclusao({
          tipo: 'sucesso',
          texto: 'Imóvel excluído com sucesso!'
        });
      }
      
      // Resetar o estado do modal
      setModoExclusao('normal');
      setImovelParaExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir imóvel:', err);
      
      // Verificar se é um erro com informações sobre imóveis secundários
      if (err instanceof Error && 'secundarios' in (err as any)) {
        const erroComSecundarios = err as ErroExclusaoComSecundarios;
        if (erroComSecundarios.secundarios && erroComSecundarios.secundarios.length > 0) {
          // Armazenar os imóveis secundários e mudar para modo cascata
          setImoveisSecundarios(erroComSecundarios.secundarios);
          setModoExclusao('cascata');
        } else {
          // Mostrar mensagem de erro
          setMensagemExclusao({
            tipo: 'erro',
            texto: err instanceof Error ? err.message : 'Erro ao excluir imóvel'
          });
          return; // Não mostrar mensagem de erro, apenas atualizar o modal
        }
      }
      
      // Mostrar mensagem de erro
      setMensagemExclusao({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao excluir imóvel'
      });
    } finally {
      setExcluindo(false);
    }
  }
  
  // Carregar dados do banco de dados
  useEffect(() => {
    async function carregarImoveis() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('ListaImoveis: Iniciando carregamento de imóveis');
        
        // Importar o serviço de imóveis de forma dinâmica para evitar problemas com SSR
        const { buscarImoveis } = await import('../services/imovelService');
        
        // Buscar todos os imóveis
        const imoveisData = await buscarImoveis();
        console.log('ListaImoveis: Imóveis recebidos:', imoveisData);
        console.log('ListaImoveis: Tipo dos dados recebidos:', typeof imoveisData);
        console.log('ListaImoveis: É um array?', Array.isArray(imoveisData));
        
        if (Array.isArray(imoveisData)) {
          console.log('ListaImoveis: Quantidade de imóveis:', imoveisData.length);
          if (imoveisData.length > 0) {
            console.log('ListaImoveis: Primeiro imóvel:', imoveisData[0]);
            console.log('ListaImoveis: Propriedades do primeiro imóvel:', Object.keys(imoveisData[0]));
          }
        }
        
        setImoveis(imoveisData);
      } catch (err) {
        console.error('Erro ao carregar imóveis:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar lista de imóveis');
      } finally {
        setLoading(false);
      }
    }
    
    carregarImoveis();
  }, []);
  
  // Filtrar imóveis
  const imoveisFiltrados = useMemo(() => {
    console.log('ListaImoveis: Calculando imóveis filtrados. Total de imóveis:', imoveis.length);
    
    try {
      return imoveis.filter(imovel => {
        if (!imovel || typeof imovel !== 'object') {
          console.error('ListaImoveis: Imóvel inválido:', imovel);
          return false;
        }
        
        if (!imovel.matricula || !imovel.localizacao || !imovel.objeto) {
          console.warn('ListaImoveis: Imóvel com propriedades faltando:', imovel);
          return false;
        }
        
        const matchBusca = 
          imovel.matricula.toLowerCase().includes(busca.toLowerCase()) ||
          imovel.localizacao.toLowerCase().includes(busca.toLowerCase()) ||
          imovel.objeto.toLowerCase().includes(busca.toLowerCase());
          
        // Se houver uma busca ativa, ignorar os outros filtros
        if (busca.trim() !== '') {
          return matchBusca;
        }
        
        // Caso contrário, aplicar todos os filtros
        const matchTipo = filtroTipo ? imovel.tipoImovel === filtroTipo : true;
        const matchStatus = filtroStatus ? imovel.statusTransferencia === filtroStatus : true;
        const matchTipoImovel = 
          filtroTipoImovel === 'todos' ? true : 
          filtroTipoImovel === 'principal' ? imovel.imovelPaiId === null : 
          filtroTipoImovel === 'secundario' ? imovel.imovelPaiId !== null : 
          true;
        
        return matchTipo && matchStatus && matchTipoImovel;
      });
    } catch (err) {
      console.error('ListaImoveis: Erro ao filtrar imóveis:', err);
      return [];
    }
  }, [imoveis, busca, filtroTipo, filtroStatus, filtroTipoImovel]);
  
  // Função para exportar dados para Excel já implementada no componente ExcelExporterTodos
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modal de confirmação de exclusão */}
      {imovelParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm">
          {/* Overlay para fechar ao clicar fora */}
          <div className="absolute inset-0" onClick={() => setImovelParaExcluir(null)}></div>
          
          {/* Modal container */}
          <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            {/* Cabeçalho */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {modoExclusao === 'normal' ? 'Confirmar exclusão' : 'Exclusão em cascata'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {modoExclusao === 'normal' 
                      ? `Tem certeza que deseja excluir o imóvel ${imovelParaExcluir.matricula} - ${imovelParaExcluir.objeto}?` 
                      : `Ao excluir o imóvel principal ${imovelParaExcluir.matricula}, os seguintes imóveis secundários também serão excluídos:`
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Conteúdo */}
            <div className="px-6 py-4">
              {imoveisSecundarios.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imóveis secundários que serão excluídos:</h4>
                  <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-3">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {imoveisSecundarios.map(sec => (
                        <li key={sec.Id} className="py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 last:border-0">
                          <span className="font-medium">{sec.Matricula}</span> - {sec.Objeto}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            
            {/* Ações */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <button
                type="button"
                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                onClick={() => setImovelParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 rounded-md bg-red-600 dark:bg-red-700 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                onClick={() => imovelParaExcluir && excluirImovel(imovelParaExcluir.id, modoExclusao === 'cascata')}
              >
                {excluindo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {imoveisSecundarios.length > 0 ? `Excluir Todos (${imoveisSecundarios.length + 1})` : 'Excluir'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mensagem de exclusão */}
      {mensagemExclusao && (
        <div className={`mb-4 rounded-md p-4 ${mensagemExclusao.tipo === 'sucesso' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {mensagemExclusao.texto}
        </div>
      )}
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/30 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Imóveis</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gerencie todos os imóveis principais e secundários</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <ExcelExporterTodosExcelJS
              imoveis={imoveis}
              buttonText="Exportar Excel"
            />
            
            <Link to="/imoveis/cadastro" className="px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Novo Imóvel
            </Link>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-blue-100 dark:border-gray-700 mb-6 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Search className="mr-2 h-5 w-5 text-blue-500" />
          Filtros
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="busca" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Buscar
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                id="busca"
                className="input pl-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                placeholder="Matrícula, localização..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="filtroTipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Imóvel
            </label>
            <select
              id="filtroTipo"
              className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Rural">Rural</option>
              <option value="Terreno">Terreno</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filtroStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status de Transferência
            </label>
            <select
              id="filtroStatus"
              className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Não transferido">Não transferido</option>
              <option value="Em processo">Em processo</option>
              <option value="Transferido">Transferido</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filtroTipoImovel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoria de Imóvel
            </label>
            <select
              id="filtroTipoImovel"
              className="input bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              value={filtroTipoImovel}
              onChange={(e) => setFiltroTipoImovel(e.target.value as 'principal' | 'secundario' | 'todos')}
            >
              <option value="principal">Apenas Principais</option>
              <option value="secundario">Apenas Secundários</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Lista de imóveis */}
      <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white flex items-center">
            <Building2 className="mr-2 h-5 w-5 text-blue-500" />
            {imoveisFiltrados.length} imóvel(is) encontrado(s)
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">Última atualização: {new Date().toLocaleDateString()}</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Carregando imóveis...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erro ao carregar imóveis</h3>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        ) : imoveisFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum imóvel encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tente ajustar seus filtros ou cadastre um novo imóvel.</p>
            <div className="mt-6">
              <Link to="/imoveis/cadastro" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Novo Imóvel
              </Link>
            </div>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {imoveisFiltrados.map((imovel) => (
              <ImovelListItem
                key={imovel.id}
                imovel={imovel}
                onExcluir={prepararExclusao}
              />
            ))}
          </ul>
        )}
      </div>
      
      {/* Botão flutuante de adicionar novo imóvel */}
      <Link
        to="/imoveis/cadastro"
        className="fixed bottom-6 right-6 bg-primary-600 dark:bg-primary-700 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200 flex items-center justify-center z-10"
        aria-label="Adicionar novo imóvel"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function ImovelListItem({
  imovel,
  onExcluir
}: {
  imovel: Imovel;
  onExcluir: (imovel: Imovel) => void;
}) {
  // Removido o estado de hover, pois o botão agora é sempre visível
  
  // Log para depuração
  console.log('ImovelListItem: Renderizando imóvel:', imovel);
  
  // Verificação de segurança para evitar erros de renderização
  if (!imovel || typeof imovel !== 'object') {
    console.error('ImovelListItem: Imóvel inválido:', imovel);
    return null;
  }
  
  // Verificação de propriedades necessárias
  if (!imovel.id || !imovel.matricula || !imovel.localizacao || !imovel.objeto) {
    console.warn('ImovelListItem: Imóvel com propriedades faltando:', imovel);
    return (
      <li className="p-4 text-red-500">
        Imóvel com dados incompletos (ID: {imovel.id || 'desconhecido'})
      </li>
    );
  }
  
  return (
    <li
      className="group relative border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm"
    >
      <Link to={`/imoveis/${imovel.id}`} className="block">
        <div className="p-5 sm:px-6">
          <div className="flex items-start gap-x-4">
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-200 transform group-hover:scale-110">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
            <div className="min-w-0 flex-auto">
              <div className="flex items-start gap-x-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      {imovel.matricula} - {imovel.objeto}
                    </p>
                    {imovel.imovelPaiId === null ? (
                      <div className="rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm">
                        Principal
                      </div>
                    ) : (
                      <div className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                        Secundário
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-x-2 text-sm leading-5 text-gray-500 dark:text-gray-400">
                <p className="truncate">{imovel.localizacao}</p>
                <span className="hidden sm:inline dark:text-gray-500">•</span>
                <p className="hidden whitespace-nowrap sm:block font-medium">{formatarArea(imovel.area)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-gray-600">
                <span className={`rounded-full px-2.5 py-1 font-medium shadow-sm ${
                  imovel.statusTransferencia === 'Transferido'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : imovel.statusTransferencia === 'Em processo'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : imovel.statusTransferencia === 'Cancelado'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {imovel.statusTransferencia || 'Não definido'}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium shadow-sm border border-gray-200">
                  {imovel.tipoImovel || 'Não definido'}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium shadow-sm border border-blue-200 text-blue-700">
                  {imovel.finalidade || 'Não definido'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Botão de exclusão sempre visível e centralizado verticalmente */}
      <div
        className="absolute right-5 top-0 bottom-0 flex items-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onExcluir(imovel);
        }}
      >
        <button
          type="button"
          className="rounded-full bg-red-50 dark:bg-red-900/30 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/40 hover:text-red-700 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          title="Excluir imóvel"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}