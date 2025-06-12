import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ChevronRight, Save, X, Loader2, CheckCircle2, FileText, Upload, Plus } from 'lucide-react';
import DocumentosImovel from '../components/DocumentosImovel';
import { 
  ImovelFormData, Imovel
} from '../types/imovel';
// Opções para os selects com valores exatos do banco de dados
const opcoesDeFinaldiade = [
  { value: 'Habitação', label: 'Habitação' },
  { value: 'Comércio', label: 'Comércio' },
  { value: 'Indústria', label: 'Indústria' },
  { value: 'Agricultura', label: 'Agricultura' },
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Misto', label: 'Misto' },
  { value: 'Outros', label: 'Outros' },
  { value: 'Residencial', label: 'Residencial' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Rural', label: 'Rural' }
];

const opcoesDeTipoImovel = [
  { value: 'Residencial', label: 'Residencial' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Rural', label: 'Rural' },
  { value: 'Terreno', label: 'Terreno' },
  { value: 'Outros', label: 'Outros' },
  { value: 'Casa', label: 'Casa' },
  { value: 'Apartamento', label: 'Apartamento' }
];

const opcoesDeStatusTransferencia = [
  { value: 'Não transferido', label: 'Não transferido' },
  { value: 'Em processo', label: 'Em processo' },
  { value: 'Transferido', label: 'Transferido' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Disponível', label: 'Disponível' },
  { value: 'Em Transferência', label: 'Em Transferência' },
  { value: 'Não Aplicável', label: 'Não Aplicável' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Regularizado', label: 'Regularizado' }
];

const opcoesDeTipoPosse = [
  { value: 'Proprietário', label: 'Proprietário' },
  { value: 'Locatário', label: 'Locatário (Alugado)' },
  { value: 'Comodato', label: 'Comodato' },
  { value: 'Outros', label: 'Outros' },
  { value: 'Cedido', label: 'Cedido' }
];

const opcoesDeTipoUsoEdificacao = [
  { value: 'Residencial Unifamiliar', label: 'Residencial Unifamiliar' },
  { value: 'Residencial Multifamiliar', label: 'Residencial Multifamiliar' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Misto', label: 'Misto' },
  { value: 'Terreno sem edificação', label: 'Terreno sem edificação' },
  { value: 'Outros', label: 'Outros' },
  { value: 'Residencial', label: 'Residencial' }
];

export default function CadastroImovel() {
  const { darkMode } = useTheme();
  const [imoveisPrincipais, setImoveisPrincipais] = useState<Imovel[]>([]);
  const [carregandoImoveisPrincipais, setCarregandoImoveisPrincipais] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  
  // Carregar imóveis principais do banco de dados
  useEffect(() => {
    carregarImoveisPrincipais();
  }, []);
  
  // Valores padrão para o formulário - centralizados para evitar duplicação
  const defaultFormValues: ImovelFormData = {
    matricula: '',
    localizacao: '',
    area: undefined as any,
    objeto: '',
    matriculasOriginadas: '',
    observacao: '',
    finalidade: 'Habitação', // Usando um valor válido do tipo Finalidade
    tipoImovel: 'Residencial', // Usando um valor válido do tipo TipoImovel
    statusTransferencia: 'Não transferido', // Usando um valor válido do tipo StatusTransferencia
    imovelPaiId: null,
    infraestrutura: {
      agua: false,
      esgoto: false,
      energia: false,
      pavimentacao: false,
      iluminacao: false,
      coletaLixo: false
    },
    valorVenal: undefined as any,
    registroIPTU: '',
    latitude: '' as any, // Convertido para any porque o tipo é number
    longitude: '' as any, // Convertido para any porque o tipo é number
    tipoUsoEdificacao: 'Residencial Unifamiliar', // Usando um valor válido do tipo TipoUsoEdificacao
    tipoPosse: 'Proprietário', // Usando um valor válido do tipo TipoPosse
    pontoReferencia: ''
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ImovelFormData>({
    defaultValues: defaultFormValues
  });
  
  const [cadastrando, setCadastrando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [sucessoCadastro, setSucessoCadastro] = useState<string | null>(null);
  const [imovelCadastradoId, setImovelCadastradoId] = useState<string | null>(null);
  const [mostrarDocumentos, setMostrarDocumentos] = useState(false);
  const [documentosSelecionados, setDocumentosSelecionados] = useState<{arquivo: File}[]>([]);
  const [arquivoParaAdicionar, setArquivoParaAdicionar] = useState<File | null>(null);
  const [mostrarSeletorDocumento, setMostrarSeletorDocumento] = useState<boolean>(false);
  
  // Função para adicionar um documento à lista de documentos selecionados
  const adicionarDocumento = () => {
    if (!arquivoParaAdicionar) return;
    
    setDocumentosSelecionados(prev => [
      ...prev,
      {
        arquivo: arquivoParaAdicionar
      }
    ]);
    
    // Limpar o formulário de adição de documento
    setArquivoParaAdicionar(null);
    setMostrarSeletorDocumento(false);
  };
  
  // Função para remover um documento da lista de documentos selecionados
  const removerDocumento = (index: number) => {
    setDocumentosSelecionados(prev => prev.filter((_, i) => i !== index));
  };
  
  // Função para resetar o formulário e todos os estados
  const resetarFormulario = () => {
    // Limpar mensagens e estados
    setErroCadastro(null);
    setSucessoCadastro(null);
    setImovelCadastradoId(null);
    setMostrarDocumentos(false);
    setDocumentosSelecionados([]);
    setArquivoParaAdicionar(null);
    setMostrarSeletorDocumento(false);
    setCadastrando(false);
    
    // Resetar os campos do formulário usando os valores padrão definidos
    reset(defaultFormValues);
    
    // Rolar para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const onSubmit = async (data: ImovelFormData) => {
    try {
      setCadastrando(true);
      setErroCadastro(null);
      setSucessoCadastro(null);
      
      // Garantir que os valores de infraestrutura sejam booleanos
      const formData = {
        ...data,
        infraestrutura: {
          agua: Boolean(data.infraestrutura.agua),
          esgoto: Boolean(data.infraestrutura.esgoto),
          energia: Boolean(data.infraestrutura.energia),
          pavimentacao: Boolean(data.infraestrutura.pavimentacao),
          iluminacao: Boolean(data.infraestrutura.iluminacao),
          coletaLixo: Boolean(data.infraestrutura.coletaLixo)
        }
      };
      
      // Mostrar mensagem de carregamento
      console.log('CadastroImovel: Enviando dados do formulário para o servidor...', formData);
      console.log('Infraestrutura convertida para booleanos:', formData.infraestrutura);
      
      // Importar o serviço de imóveis de forma dinâmica para evitar problemas com SSR
      const { cadastrarImovel } = await import('../services/imovelService');
      
      // Chamar o serviço para cadastrar o imóvel
      const imovelId = await cadastrarImovel(formData);
      
      console.log('CadastroImovel: Imóvel cadastrado com sucesso! ID:', imovelId);
      
      // Armazenar o ID do imóvel cadastrado
      setImovelCadastradoId(imovelId);
      
      // Mostrar mensagem de sucesso
      setSucessoCadastro(`Imóvel cadastrado com sucesso! ID: ${imovelId}`);
      
      // Vincular documentos pré-selecionados ao imóvel
      if (documentosSelecionados.length > 0) {
        console.log(`Vinculando ${documentosSelecionados.length} documentos ao imóvel ${imovelId}...`);
        
        // Para cada documento selecionado, vinculá-lo ao imóvel
        for (const docItem of documentosSelecionados) {
          try {
            // Obter o arquivo e o tipo de documento
            const arquivo = docItem.arquivo;
            
            // Obter o caminho completo do arquivo se disponível
            let caminhoDocumento = '';
            
            // Verificar se temos acesso ao caminho completo (propriedade path)
            if ((arquivo as any).path) {
              // Usar o caminho completo se disponível
              caminhoDocumento = (arquivo as any).path;
              console.log('Usando caminho completo do arquivo:', caminhoDocumento);
            } else {
              // Caso contrário, usar o nome do arquivo
              caminhoDocumento = arquivo.name;
              console.log('Usando apenas o nome do arquivo:', caminhoDocumento);
            }
            
            // Garantir que temos um nome de arquivo válido
            const nomeDocumento = arquivo.name;
            
            // Verificar se o caminho já é absoluto
            const isAbsolutePath = caminhoDocumento.match(/^([A-Za-z]:\|\\|\/)/); 
            
            console.log('Vinculando documento:', {
              imovelId,
              caminhoDocumento,
              nomeDocumento,
              isAbsolutePath: !!isAbsolutePath
            });
            
            // Vincular o documento ao imóvel
            const response = await fetch('/api/documentos/vincular', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                imovelId,
                caminho: caminhoDocumento,     // Corrigido para 'caminho' como esperado pelo servidor
                nome: nomeDocumento,          // Corrigido para 'nome' como esperado pelo servidor
                isAbsolutePath: !!isAbsolutePath
              })
            });
            
            if (!response.ok) {
              console.error(`Erro ao vincular documento ${arquivo.name}: ${response.status}`);
            }
          } catch (err) {
            console.error(`Erro ao vincular documento ${arquivo.name}:`, err);
          }
        }
      }
      
      // Mostrar seção de documentos
      setMostrarDocumentos(true);
      
      // Recarregar a lista de imóveis principais
      carregarImoveisPrincipais();
      
      // Resetar o formulário após o cadastro bem-sucedido
      resetarFormulario();
    } catch (error) {
      console.error('CadastroImovel: Erro ao cadastrar imóvel:', error);
      setErroCadastro(error instanceof Error ? error.message : 'Erro desconhecido ao cadastrar imóvel');
    } finally {
      setCadastrando(false);
    }
  };
  
  // Função para carregar imóveis principais
  async function carregarImoveisPrincipais() {
    try {
      setCarregandoImoveisPrincipais(true);
      setErroCarregamento(null);
      
      console.log('CadastroImovel: Carregando imóveis principais');
      
      // Importar o serviço de imóveis de forma dinâmica
      const { listarImoveisPrincipais } = await import('../services/imovelService');
      
      // Buscar imóveis principais
      const imoveisData = await listarImoveisPrincipais();
      console.log('CadastroImovel: Imóveis principais carregados:', imoveisData.length);
      setImoveisPrincipais(imoveisData);
    } catch (err) {
      console.error('CadastroImovel: Erro ao carregar imóveis principais:', err);
      setErroCarregamento(err instanceof Error ? err.message : 'Erro ao carregar imóveis principais');
    } finally {
      setCarregandoImoveisPrincipais(false);
    }
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-x-2 text-xs">
          <Link to="/imoveis" className={`hover:text-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Imóveis
          </Link>
          <ChevronRight className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>Novo Cadastro</span>
        </div>
        <h1 className={`mt-1 text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Cadastrar Novo Imóvel</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className={`card p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : ''}`}>
          <div className="space-y-6">
            {/* Dividir o formulário em seções para melhor organização */}
            <div className="space-y-8">
              {/* Seção 1: Informações Básicas */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Informações Básicas</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="matricula" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Matrícula*
                    </label>
                    <input
                      type="text"
                      id="matricula"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.matricula ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('matricula', { required: 'Matrícula é obrigatória' })}
                    />
                    {errors.matricula && (
                      <p className="mt-1 text-xs text-danger-600">{errors.matricula.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="area" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Área Total (m²)*
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="area"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.area ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('area', { 
                        required: 'Área é obrigatória',
                        min: { value: 0.01, message: 'Área deve ser maior que zero' }
                      })}
                    />
                    {errors.area && (
                      <p className="mt-1 text-xs text-danger-600">{errors.area.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="registroIPTU" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Registro IPTU
                    </label>
                    <input
                      type="text"
                      id="registroIPTU"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                      {...register('registroIPTU')}
                    />
                  </div>

                  <div>
                    <label htmlFor="valorVenal" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Valor Venal (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="valorVenal"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                      {...register('valorVenal')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="finalidade" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Finalidade*
                    </label>
                    <select
                      id="finalidade"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.finalidade ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('finalidade', { required: 'Finalidade é obrigatória' })}
                    >
                      <option value="" disabled>Selecione uma finalidade</option>
                      {opcoesDeFinaldiade.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                    {errors.finalidade && (
                      <p className="mt-1 text-xs text-danger-600">{errors.finalidade.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="tipoImovel" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Tipo do Imóvel*
                    </label>
                    <select
                      id="tipoImovel"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoImovel ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('tipoImovel', { required: 'Tipo do imóvel é obrigatório' })}
                    >
                      <option value="" disabled>Selecione um tipo de imóvel</option>
                      {opcoesDeTipoImovel.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                    {errors.tipoImovel && (
                      <p className="mt-1 text-xs text-danger-600">{errors.tipoImovel.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 2: Classificação do Imóvel */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Classificação do Imóvel</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="tipoUsoEdificacao" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Tipo de Uso e Edificação*
                    </label>
                    <select
                      id="tipoUsoEdificacao"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoUsoEdificacao ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('tipoUsoEdificacao', { required: 'Tipo de uso é obrigatório' })}
                    >
                      <option value="" disabled>Selecione um tipo de uso</option>
                      {opcoesDeTipoUsoEdificacao.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tipoPosse" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Tipo de Posse*
                    </label>
                    <select
                      id="tipoPosse"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoPosse ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('tipoPosse', { required: 'Tipo de posse é obrigatório' })}
                    >
                      <option value="" disabled>Selecione um tipo de posse</option>
                      {opcoesDeTipoPosse.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="statusTransferencia" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Status de Transferência*
                    </label>
                    <select
                      id="statusTransferencia"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.statusTransferencia ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('statusTransferencia', { required: 'Status de transferência é obrigatório' })}
                    >
                      <option value="" disabled>Selecione um status de transferência</option>
                      {opcoesDeStatusTransferencia.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                    {errors.statusTransferencia && (
                      <p className="mt-1 text-xs text-danger-600">{errors.statusTransferencia.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="imovelPaiId" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Imóvel Principal
                    </label>
                    {carregandoImoveisPrincipais ? (
                      <div className="flex items-center space-x-2 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                        <span className="text-sm text-gray-500">Carregando imóveis principais...</span>
                      </div>
                    ) : erroCarregamento ? (
                      <div className="text-sm text-red-500 mt-2">
                        Erro ao carregar imóveis principais: {erroCarregamento}
                      </div>
                    ) : (
                      <select
                        id="imovelPaiId"
                        className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                        {...register('imovelPaiId')}
                      >
                        <option value="">Nenhum (Este é um imóvel principal)</option>
                        {imoveisPrincipais.map((imovel) => (
                          <option key={imovel.id} value={imovel.id}>
                            {imovel.matricula} - {imovel.localizacao}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Selecione um imóvel principal se este for um imóvel secundário (desmembrado).
                    </p>
                  </div>

                  <div>
                    <label htmlFor="matriculasOriginadas" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Matrículas Originadas
                    </label>
                    <input
                      type="text"
                      id="matriculasOriginadas"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                      {...register('matriculasOriginadas')}
                    />
                    <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Informe as matrículas originadas deste imóvel, separadas por vírgula.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 3: Localização */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Localização</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="localizacao" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Endereço/Localização*
                    </label>
                    <input
                      type="text"
                      id="localizacao"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.localizacao ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                      {...register('localizacao', { required: 'Localização é obrigatória' })}
                    />
                    {errors.localizacao && (
                      <p className="mt-1 text-xs text-danger-600">{errors.localizacao.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="pontoReferencia" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      id="pontoReferencia"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                      {...register('pontoReferencia')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="latitude" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        id="latitude"
                        className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                        {...register('latitude')}
                      />
                    </div>

                    <div>
                      <label htmlFor="longitude" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        id="longitude"
                        className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                        {...register('longitude')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 4: Documentos */}
              <div className="mb-6">
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                    Documentos
                  </div>
                </h3>
                
                <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  {documentosSelecionados.length > 0 ? (
                    <div className="mb-4">
                      <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Documentos selecionados para vincular ao imóvel:
                      </h4>
                      <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {documentosSelecionados.map((doc, index) => (
                          <li key={index} className="py-2 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <FileText className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="ml-3">
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {doc.arquivo.name}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {(doc.arquivo.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removerDocumento(index)}
                              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-200 text-gray-500 hover:text-red-500'}`}
                              title="Remover documento"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className={`text-sm italic mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Nenhum documento selecionado. Adicione documentos para vincular ao imóvel após o cadastro.
                    </p>
                  )}
                  
                  {mostrarSeletorDocumento ? (
                    <div className="mt-4 p-4 border rounded-md ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-white'}">
                      <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Adicionar documento
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Arquivo
                          </label>
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setArquivoParaAdicionar(e.target.files[0]);
                              }
                            }}
                            className={`block w-full text-sm ${darkMode ? 'text-gray-300 file:bg-gray-600 file:text-white' : 'text-gray-700 file:bg-gray-200'} 
                                    file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium
                                    ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-md`}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setMostrarSeletorDocumento(false)}
                            className={`px-3 py-2 text-sm rounded-md ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={adicionarDocumento}
                            disabled={!arquivoParaAdicionar}
                            className={`px-3 py-2 text-sm rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white
                                      ${!arquivoParaAdicionar ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMostrarSeletorDocumento(true)}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Documento
                    </button>
                  )}
                </div>
              </div>
              
              {/* Seção 5: Infraestrutura */}
              <div>
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Infraestrutura Disponível</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.agua')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Água</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.esgoto')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Esgoto</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.energia')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Energia</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.pavimentacao')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pavimentação</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.iluminacao')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Iluminação</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.coletaLixo')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Coleta de Lixo</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Seção 5: Descrição */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Descrição</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="objeto" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Objeto*
                  </label>
                  <input
                    type="text"
                    id="objeto"
                    className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.objeto ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    {...register('objeto', { required: 'Objeto é obrigatório' })}
                  />
                  {errors.objeto && (
                    <p className="mt-1 text-xs text-danger-600">{errors.objeto.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="observacao" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Observação
                  </label>
                  <textarea
                    id="observacao"
                    rows={4}
                    className={`input mt-1 w-full ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}`}
                    {...register('observacao')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {sucessoCadastro && (
          <div className={`mb-6 p-4 rounded-md flex items-start ${darkMode ? 'bg-green-900 border border-green-800 text-green-100' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{sucessoCadastro}</p>
              <p className="text-sm">Você pode vincular documentos ao imóvel ou cadastrar um novo imóvel.</p>
            </div>
          </div>
        )}
        

        
        {erroCadastro && (
          <div className={`mb-6 p-4 rounded-md flex items-start ${darkMode ? 'bg-red-900 border border-red-800 text-red-100' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            <div>
              <p className="text-sm font-medium">Erro ao cadastrar imóvel:</p>
              <p className="text-sm">{erroCadastro}</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Link to="/imoveis" className={`btn ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'btn-secondary'}`}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting || cadastrando}
            className={`btn ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'btn-primary'} ${cadastrando ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {cadastrando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}