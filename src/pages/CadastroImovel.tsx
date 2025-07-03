import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Save, X, Loader2, CheckCircle2, FileText, Plus, AlertCircle, PlusCircle } from 'lucide-react';
import CustomValueModal from '../components/CustomValueModal';
import CustomizableSelect from '../components/CustomizableSelect';
import { buscarValoresPersonalizados, combinarValores, adicionarValorPersonalizado, excluirValorPersonalizado, OpcaoSelect } from '../services/valoresPersonalizadosService';
// import DocumentosImovel from '../components/DocumentosImovel'; // Não utilizado no momento
import { 
  ImovelFormData, Imovel
} from '../types/imovel';
import { useTheme } from '../contexts/ThemeContext';
import { verificarMatriculaExistente } from '../services/imovelService';

// Opções para os selects - arrays vazios para usar apenas valores personalizados
const opcoesDeFinaldiade: OpcaoSelect[] = [];

const opcoesDeTipoImovel: OpcaoSelect[] = [];

const opcoesDeStatusTransferencia: OpcaoSelect[] = [];

const opcoesDeTipoPosse: OpcaoSelect[] = [];

const opcoesDeTipoUsoEdificacao: OpcaoSelect[] = [];

export default function CadastroImovel() {
  const { darkMode } = useTheme();
  const [documentosSelecionados, setDocumentosSelecionados] = useState<{arquivo: File}[]>([]);
  const [arquivoParaAdicionar, setArquivoParaAdicionar] = useState<File | null>(null);
  const [mostrarSeletorDocumento, setMostrarSeletorDocumento] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [sucessoCadastro, setSucessoCadastro] = useState<string | null>(null);
  const [verificandoMatricula, setVerificandoMatricula] = useState(false);
  const [matriculaExistente, setMatriculaExistente] = useState(false);
  const [matriculaVerificada, setMatriculaVerificada] = useState<string>('');
  // Este estado é usado para controlar a exibição da seção de documentos
  const [mostrarDocumentos, setMostrarDocumentos] = useState(false);
  // O ID do imóvel cadastrado é usado na função onSubmit, então mantenha-o
  const [imovelCadastradoId, setImovelCadastradoId] = useState<string | null>(null);
  const [imoveisPrincipais, setImoveisPrincipais] = useState<Imovel[]>([]);
  const [carregandoImoveisPrincipais, setCarregandoImoveisPrincipais] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  
  // Estados para os valores personalizados
  const [opcoesFinaldiade, setOpcoesFinaldiade] = useState<OpcaoSelect[]>(opcoesDeFinaldiade);
  const [opcoesTipoImovel, setOpcoesTipoImovel] = useState<OpcaoSelect[]>(opcoesDeTipoImovel);
  const [opcoesTipoUsoEdificacao, setOpcoesTipoUsoEdificacao] = useState<OpcaoSelect[]>(opcoesDeTipoUsoEdificacao);
  const [opcoesTipoPosse, setOpcoesTipoPosse] = useState<OpcaoSelect[]>(opcoesDeTipoPosse);
  const [opcoesStatusTransferencia, setOpcoesStatusTransferencia] = useState<OpcaoSelect[]>(opcoesDeStatusTransferencia);
  
  // Estados para o modal de valores personalizados
  const [modalAberto, setModalAberto] = useState(false);
  const [tituloModal, setTituloModal] = useState('');
  const [categoriaAtual, setCategoriaAtual] = useState('');
  const [carregandoValoresPersonalizados, setCarregandoValoresPersonalizados] = useState(false);
  
  // Função para abrir o modal de valor personalizado
  const abrirModalValorPersonalizado = (categoria: string) => {
    const titulos: Record<string, string> = {
      'Finalidade': 'Nova Finalidade',
      'TipoImovel': 'Novo Tipo de Imóvel',
      'TipoUsoEdificacao': 'Novo Tipo de Uso da Edificação',
      'TipoPosse': 'Novo Tipo de Posse',
      'StatusTransferencia': 'Novo Status de Transferência'
    };
    
    setTituloModal(titulos[categoria] || `Novo ${categoria}`);
    setCategoriaAtual(categoria);
    setModalAberto(true);
  };
  
  // Função para adicionar um novo valor personalizado
  const adicionarNovoValor = async (categoria: string, valor: string) => {
    if (!valor.trim()) return;
    
    try {
      setCarregandoValoresPersonalizados(true);
      // Adicionar o valor personalizado
      await adicionarValorPersonalizado(categoria, valor.trim());
      
      // Buscar valores personalizados atualizados após a adição
      const valoresAtualizados = await buscarValoresPersonalizados(categoria);
      console.log(`Valores personalizados atualizados para ${categoria}:`, valoresAtualizados);
      
      // Encontrar o valor recém-adicionado nos valores atualizados
      const novoValorAdicionado = valoresAtualizados.find(v => 
        (v.valor || v.Valor) === valor.trim()
      );
      
      if (novoValorAdicionado) {
        const valorLabel = novoValorAdicionado.valor || novoValorAdicionado.Valor;
        
        // Atualizar as opções do select correspondente
        switch (categoria) {
          case 'Finalidade':
            setOpcoesFinaldiade(combinarValores(opcoesDeFinaldiade, valoresAtualizados));
            // Forçar a atualização do valor selecionado no formulário
            setTimeout(() => {
              // Usar any para contornar a tipagem estrita
              setValue('finalidade', valorLabel as any);
            }, 100);
            break;
          case 'TipoImovel':
            setOpcoesTipoImovel(combinarValores(opcoesDeTipoImovel, valoresAtualizados));
            setTimeout(() => {
              setValue('tipoImovel', valorLabel as any);
            }, 100);
            break;
          case 'TipoUsoEdificacao':
            setOpcoesTipoUsoEdificacao(combinarValores(opcoesDeTipoUsoEdificacao, valoresAtualizados));
            setTimeout(() => {
              setValue('tipoUsoEdificacao', valorLabel as any);
            }, 100);
            break;
          case 'TipoPosse':
            setOpcoesTipoPosse(combinarValores(opcoesDeTipoPosse, valoresAtualizados));
            setTimeout(() => {
              setValue('tipoPosse', valorLabel as any);
            }, 100);
            break;
          case 'StatusTransferencia':
            setOpcoesStatusTransferencia(combinarValores(opcoesDeStatusTransferencia, valoresAtualizados));
            setTimeout(() => {
              setValue('statusTransferencia', valorLabel as any);
            }, 100);
            break;
        }
      } else {
        // Se não encontrar o valor adicionado, apenas atualiza as opções
        switch (categoria) {
          case 'Finalidade':
            setOpcoesFinaldiade(combinarValores(opcoesDeFinaldiade, valoresAtualizados));
            break;
          case 'TipoImovel':
            setOpcoesTipoImovel(combinarValores(opcoesDeTipoImovel, valoresAtualizados));
            break;
          case 'TipoUsoEdificacao':
            setOpcoesTipoUsoEdificacao(combinarValores(opcoesDeTipoUsoEdificacao, valoresAtualizados));
            break;
          case 'TipoPosse':
            setOpcoesTipoPosse(combinarValores(opcoesDeTipoPosse, valoresAtualizados));
            break;
          case 'StatusTransferencia':
            setOpcoesStatusTransferencia(combinarValores(opcoesDeStatusTransferencia, valoresAtualizados));
            break;
        }
      }
      
      // Mostrar mensagem de sucesso temporária
      console.log(`Valor personalizado '${valor}' adicionado com sucesso para ${categoria}`);
    } catch (error) {
      console.error(`Erro ao adicionar valor personalizado para ${categoria}:`, error);
    } finally {
      setCarregandoValoresPersonalizados(false);
    }
  };
  
  // Função para excluir um valor personalizado
  const handleDeleteCustomValue = async (categoria: string, valorToDelete: string) => {
    try {
      console.log(`Excluindo valor personalizado: ${valorToDelete} da categoria ${categoria}`);
      
      // Buscar os valores personalizados para encontrar o ID do valor a ser excluído
      const valoresPersonalizados = await buscarValoresPersonalizados(categoria);
      const valorToExclude = valoresPersonalizados.find(v => 
        (v.Valor || v.valor) === valorToDelete
      );
      
      if (!valorToExclude) {
        console.error(`Valor personalizado ${valorToDelete} não encontrado`);
        return;
      }
      
      const valorId = valorToExclude.Id || valorToExclude.id;
      
      if (!valorId) {
        console.error('ID do valor personalizado não encontrado');
        return;
      }
      
      // Excluir o valor personalizado
      await excluirValorPersonalizado(valorId);
      
      // Atualizar a lista de valores personalizados
      switch (categoria) {
        case 'Finalidade':
          setOpcoesFinaldiade(prev => prev.filter(option => option.value !== valorToDelete));
          break;
        case 'TipoImovel':
          setOpcoesTipoImovel(prev => prev.filter(option => option.value !== valorToDelete));
          break;
        case 'TipoUsoEdificacao':
          setOpcoesTipoUsoEdificacao(prev => prev.filter(option => option.value !== valorToDelete));
          break;
        case 'TipoPosse':
          setOpcoesTipoPosse(prev => prev.filter(option => option.value !== valorToDelete));
          break;
        case 'StatusTransferencia':
          setOpcoesStatusTransferencia(prev => prev.filter(option => option.value !== valorToDelete));
          break;
      }
      
      console.log(`Valor personalizado ${valorToDelete} excluído com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir valor personalizado:', error);
    }
  };
  
  // Carregar imóveis principais e valores personalizados do banco de dados
  useEffect(() => {
    carregarImoveisPrincipais();
    carregarValoresPersonalizados();
  }, []);
  
  // Função para carregar valores personalizados de todas as categorias
  async function carregarValoresPersonalizados() {
    setCarregandoValoresPersonalizados(true);
    
    const categorias = ['Finalidade', 'TipoImovel', 'TipoUsoEdificacao', 'TipoPosse', 'StatusTransferencia'];
    
    try {
      // Carregar valores personalizados para cada categoria
      for (const categoria of categorias) {
        try {
          const valoresPersonalizados = await buscarValoresPersonalizados(categoria);
          
          console.log(`Valores personalizados recebidos para ${categoria}:`, valoresPersonalizados);
          
          // Atualizar o estado correspondente com os valores combinados
          switch (categoria) {
            case 'Finalidade':
              setOpcoesFinaldiade(combinarValores(opcoesDeFinaldiade, valoresPersonalizados));
              console.log('Valores personalizados de Finalidade atualizados:', opcoesFinaldiade);
              break;
            case 'TipoImovel':
              setOpcoesTipoImovel(combinarValores(opcoesDeTipoImovel, valoresPersonalizados));
              console.log('Valores personalizados de TipoImovel atualizados:', opcoesTipoImovel);
              break;
            case 'TipoUsoEdificacao':
              setOpcoesTipoUsoEdificacao(combinarValores(opcoesDeTipoUsoEdificacao, valoresPersonalizados));
              console.log('Valores personalizados de TipoUsoEdificacao atualizados:', opcoesTipoUsoEdificacao);
              break;
            case 'TipoPosse':
              setOpcoesTipoPosse(combinarValores(opcoesDeTipoPosse, valoresPersonalizados));
              console.log('Valores personalizados de TipoPosse atualizados:', opcoesTipoPosse);
              break;
            case 'StatusTransferencia':
              setOpcoesStatusTransferencia(combinarValores(opcoesDeStatusTransferencia, valoresPersonalizados));
              console.log('Valores personalizados de StatusTransferencia atualizados:', opcoesStatusTransferencia);
              break;
          }
        } catch (error) {
          console.error(`Erro ao carregar valores personalizados para ${categoria}:`, error);
        }
      }
    } finally {
      setCarregandoValoresPersonalizados(false);
    }
  }
  
  // Valores padrão para o formulário - centralizados para evitar duplicação
  // Valores padrão vazios para o formulário
  const defaultFormValues: ImovelFormData = {
    matricula: '',
    localizacao: '',
    area: undefined as any,
    objeto: '',
    matriculasOriginadas: '',
    observacao: '',
    finalidade: undefined as any, // Campo vazio
    tipoImovel: undefined as any, // Campo vazio
    statusTransferencia: undefined as any, // Campo vazio
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
    latitude: undefined as any, // Campo vazio
    longitude: undefined as any, // Campo vazio
    tipoUsoEdificacao: undefined as any, // Campo vazio
    tipoPosse: undefined as any, // Campo vazio
    pontoReferencia: ''
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue, setError } = useForm<ImovelFormData>({
    defaultValues: defaultFormValues,
    mode: 'onBlur', // Validar ao perder o foco para melhor experiência do usuário
    shouldFocusError: true // Focar automaticamente no primeiro campo com erro
  });
  
  // Observar o campo matrícula para validação em tempo real
  const matriculaAtual = watch('matricula');
  
  // Efeito para verificar se a matrícula já existe quando o usuário digitar
  useEffect(() => {
    const verificarMatricula = async () => {
      // Verificar apenas se o campo não estiver vazio e se for diferente da última matrícula verificada
      if (matriculaAtual && matriculaAtual.trim() !== '' && matriculaAtual !== matriculaVerificada) {
        setVerificandoMatricula(true);
        try {
          const existe = await verificarMatriculaExistente(matriculaAtual);
          setMatriculaExistente(existe);
          setMatriculaVerificada(matriculaAtual);
        } catch (error) {
          console.error('Erro ao verificar matrícula:', error);
        } finally {
          setVerificandoMatricula(false);
        }
      } else if (matriculaAtual === '') {
        // Resetar o estado quando o campo estiver vazio
        setMatriculaExistente(false);
        setMatriculaVerificada('');
      }
    };
    
    // Usar um temporizador para evitar muitas requisições enquanto o usuário digita
    const timer = setTimeout(verificarMatricula, 500);
    return () => clearTimeout(timer);
  }, [matriculaAtual, matriculaVerificada]);
  


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
  
  // Função para validar campos de seleção antes do envio
  const validarCamposSelecao = (data: ImovelFormData) => {
    // Verificar se os campos de seleção obrigatórios estão preenchidos com valores válidos
    const camposObrigatorios = [
      { campo: 'finalidade', nome: 'Finalidade', mensagem: 'Finalidade é obrigatória' },
      { campo: 'tipoImovel', nome: 'Tipo do Imóvel', mensagem: 'Tipo do imóvel é obrigatório' },
      { campo: 'tipoUsoEdificacao', nome: 'Tipo de Uso e Edificação', mensagem: 'Tipo de uso é obrigatório' },
      { campo: 'tipoPosse', nome: 'Tipo de Posse', mensagem: 'Tipo de posse é obrigatório' },
      { campo: 'statusTransferencia', nome: 'Status de Transferência', mensagem: 'Status de transferência é obrigatório' }
    ];
    
    let camposInvalidos: string[] = [];
    let todosValidos = true;
    
    camposObrigatorios.forEach(({ campo, nome, mensagem }) => {
      const valor = data[campo as keyof ImovelFormData];
      if (!valor) {
        camposInvalidos.push(nome);
        // Definir erro manualmente para o campo
        setValue(campo as any, '', { shouldValidate: true });
        // Forçar o erro a ser registrado no objeto errors
        setError(campo as any, {
          type: 'manual',
          message: mensagem
        });
        todosValidos = false;
      }
    });
    
    if (camposInvalidos.length > 0) {
      console.error('Campos obrigatórios não preenchidos:', camposInvalidos);
      
      // Scroll para o primeiro elemento com erro
      setTimeout(() => {
        // Obter todos os elementos com erro
        const elementosComErro = document.querySelectorAll('.border-danger-500');
        if (elementosComErro.length > 0) {
          // Scroll para o primeiro elemento com erro
          elementosComErro[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100); // Pequeno delay para garantir que os erros foram renderizados
      
      return false;
    }
    
    return todosValidos;
  };

  // Função para enviar o formulário
  const onSubmit = async (data: ImovelFormData) => {
    // Validar campos de seleção antes de prosseguir
    if (!validarCamposSelecao(data)) {
      return; // Interromper o envio se a validação falhar
    }
    try {
      // Verificar novamente se a matrícula já existe antes de enviar o formulário
      const matriculaJaExiste = await verificarMatriculaExistente(data.matricula);
      if (matriculaJaExiste) {
        setErroCadastro('A matrícula informada já está cadastrada no sistema.');
        return;
      }
      
      setCadastrando(true);
      setErroCadastro(null);
      setSucessoCadastro(null);
      
      // Tratar o valor da área para garantir que seja enviado com vírgula como separador decimal
      let areaFormatada = data.area;
      if (data.area) {
        // Converter para string se for número
        const areaStr = data.area.toString();
        // Se já tiver vírgula, manter como está. Se tiver ponto, converter para vírgula
        if (areaStr.includes('.')) {
          areaFormatada = areaStr.replace('.', ',');
        } else {
          areaFormatada = areaStr;
        }
      }
      
      // Garantir que os valores de infraestrutura sejam booleanos
      const formData = {
        ...data,
        area: areaFormatada, // Usar o valor formatado com vírgula
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
          // Definir variáveis no escopo externo para acesso no bloco catch
          let caminhoDocumento = '';
          let nomeDocumento = '';
          
          try {
            // Obter o arquivo do documento
            const arquivoFile = docItem.arquivo; // Acessar o objeto File dentro do documento
            
            // Verificar se temos acesso ao caminho completo (propriedade path)
            if ((arquivoFile as any).path) {
              // Usar o caminho completo se disponível
              caminhoDocumento = (arquivoFile as any).path;
              console.log('Usando caminho completo do arquivo:', caminhoDocumento);
            } else {
              // Caso contrário, usar o nome do arquivo
              caminhoDocumento = arquivoFile.name;
              console.log('Usando apenas o nome do arquivo:', caminhoDocumento);
            }
            
            // Garantir que temos um nome de arquivo válido
            const nomeDocumento = arquivoFile.name;
            
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
              console.error(`Erro ao vincular documento ${nomeDocumento}: ${response.status}`);
            }
          } catch (err) {
            // Usar nome do documento que já foi extraído anteriormente
            console.error(`Erro ao vincular documento:`, err);
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
      
      <form onSubmit={handleSubmit(onSubmit, () => {
        // Scroll para o primeiro elemento com erro quando a validação falhar
        setTimeout(() => {
          const elementosComErro = document.querySelectorAll('.border-danger-500');
          if (elementosComErro.length > 0) {
            elementosComErro[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      })} className="space-y-6">
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
                    <div className="relative">
                      <input
                        type="text"
                        id="matricula"
                        className={`input mt-1 pr-10 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.matricula ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                        {...register('matricula', { required: 'Matrícula é obrigatória' })}
                      />
                      {verificandoMatricula && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/3">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      )}
                      {matriculaExistente && !verificandoMatricula && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/3">
                          <AlertCircle className="h-5 w-5 text-danger-500" />
                        </div>
                      )}
                    </div>
                    {errors.matricula && (
                      <p className="mt-1 text-xs text-danger-600">{errors.matricula.message}</p>
                    )}
                    {matriculaExistente && !verificandoMatricula && (
                      <p className="mt-1 text-xs text-danger-600">Esta matrícula já está cadastrada no sistema.</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="area" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Área Total (m²)*
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      id="area"
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.area ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                      {...register('area', { 
                        required: 'Área é obrigatória',
                        validate: value => {
                          // Garantir que value seja tratado como string antes de usar replace
                          const valueStr = value.toString();
                          const num = parseFloat(valueStr.replace(',', '.'));
                          if (isNaN(num)) return 'Digite um número válido';
                          if (num <= 0) return 'Área deve ser maior que zero';
                          return true;
                        }
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
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
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
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                      {...register('valorVenal')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="finalidade" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Finalidade*
                    </label>
                    <div className="flex gap-2">
                      <CustomizableSelect
                        id="finalidade"
                        name="finalidade"
                        value={watch('finalidade') || ''}
                        onChange={(e) => {
                          const event = { target: { name: 'finalidade', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                          register('finalidade', { 
                            required: 'Finalidade é obrigatória',
                            validate: value => !!value || 'Selecione uma finalidade válida'
                          }).onChange(event);
                        }}
                        options={opcoesFinaldiade}
                        className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.finalidade ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Selecione uma finalidade"
                        disabled={matriculaExistente || verificandoMatricula}
                        required
                        onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('Finalidade', deletedValue)}
                      />
                      <button
                        type="button"
                        onClick={() => abrirModalValorPersonalizado('Finalidade')}
                        className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        disabled={matriculaExistente || verificandoMatricula || carregandoValoresPersonalizados}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {errors.finalidade && (
                      <p className="mt-1 text-xs text-danger-600">{errors.finalidade.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="tipoImovel" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Tipo do Imóvel*
                    </label>
                    <div className="flex gap-2">
                      <CustomizableSelect
                        id="tipoImovel"
                        name="tipoImovel"
                        value={watch('tipoImovel') || ''}
                        onChange={(e) => {
                          const event = { target: { name: 'tipoImovel', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                          register('tipoImovel', { 
                            required: 'Tipo do imóvel é obrigatório',
                            validate: value => !!value || 'Selecione um tipo de imóvel válido'
                          }).onChange(event);
                        }}
                        options={opcoesTipoImovel}
                        className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoImovel ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Selecione um tipo de imóvel"
                        disabled={matriculaExistente || verificandoMatricula}
                        required
                        onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('TipoImovel', deletedValue)}
                      />
                      <button
                        type="button"
                        onClick={() => abrirModalValorPersonalizado('TipoImovel')}
                        className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        disabled={matriculaExistente || verificandoMatricula || carregandoValoresPersonalizados}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
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
                    <div className="flex gap-2">
                      <CustomizableSelect
                        id="tipoUsoEdificacao"
                        name="tipoUsoEdificacao"
                        value={watch('tipoUsoEdificacao') || ''}
                        onChange={(e) => {
                          const event = { target: { name: 'tipoUsoEdificacao', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                          register('tipoUsoEdificacao', { 
                            required: 'Tipo de uso é obrigatório',
                            validate: value => !!value || 'Selecione um tipo de uso válido'
                          }).onChange(event);
                        }}
                        options={opcoesTipoUsoEdificacao}
                        className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoUsoEdificacao ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Selecione um tipo de uso"
                        disabled={matriculaExistente || verificandoMatricula}
                        required
                        onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('TipoUsoEdificacao', deletedValue)}
                      />
                      <button
                        type="button"
                        onClick={() => abrirModalValorPersonalizado('TipoUsoEdificacao')}
                        className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        disabled={matriculaExistente || verificandoMatricula || carregandoValoresPersonalizados}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {errors.tipoUsoEdificacao && (
                      <p className="mt-1 text-xs text-danger-600">{errors.tipoUsoEdificacao.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="tipoPosse" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Tipo de Posse*
                    </label>
                    <div className="flex gap-2">
                      <CustomizableSelect
                        id="tipoPosse"
                        name="tipoPosse"
                        value={watch('tipoPosse') || ''}
                        onChange={(e) => {
                          const event = { target: { name: 'tipoPosse', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                          register('tipoPosse', { 
                            required: 'Tipo de posse é obrigatório',
                            validate: value => !!value || 'Selecione um tipo de posse válido'
                          }).onChange(event);
                        }}
                        options={opcoesTipoPosse}
                        className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoPosse ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Selecione um tipo de posse"
                        disabled={matriculaExistente || verificandoMatricula}
                        required
                        onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('TipoPosse', deletedValue)}
                      />
                      <button
                        type="button"
                        onClick={() => abrirModalValorPersonalizado('TipoPosse')}
                        className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        disabled={matriculaExistente || verificandoMatricula || carregandoValoresPersonalizados}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {errors.tipoPosse && (
                      <p className="mt-1 text-xs text-danger-600">{errors.tipoPosse.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="statusTransferencia" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                      Status de Transferência*
                    </label>
                    <div className="flex gap-2">
                      <CustomizableSelect
                        id="statusTransferencia"
                        name="statusTransferencia"
                        value={watch('statusTransferencia') || ''}
                        onChange={(e) => {
                          const event = { target: { name: 'statusTransferencia', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>;
                          register('statusTransferencia', { 
                            required: 'Status de transferência é obrigatório',
                            validate: value => !!value || 'Selecione um status de transferência válido'
                          }).onChange(event);
                        }}
                        options={opcoesStatusTransferencia}
                        className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.statusTransferencia ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="Selecione um status de transferência"
                        disabled={matriculaExistente || verificandoMatricula}
                        required
                        onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('StatusTransferencia', deletedValue)}
                      />
                      <button
                        type="button"
                        onClick={() => abrirModalValorPersonalizado('StatusTransferencia')}
                        className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        disabled={matriculaExistente || verificandoMatricula || carregandoValoresPersonalizados}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
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
                        className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={matriculaExistente || verificandoMatricula}
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
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                      {...register('matriculasOriginadas')}
                    />
                    <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Informe as matrículas originadas deste imóvel
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
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.localizacao ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
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
                      className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
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
                        className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={matriculaExistente || verificandoMatricula}
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
                        className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={matriculaExistente || verificandoMatricula}
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
                      disabled={matriculaExistente || verificandoMatricula}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'} ${matriculaExistente ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500 ${matriculaExistente ? 'cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Água</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.esgoto')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500 ${matriculaExistente ? 'cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Esgoto</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.energia')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500 ${matriculaExistente ? 'cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Energia</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.pavimentacao')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500 ${matriculaExistente ? 'cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pavimentação</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.iluminacao')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500 ${matriculaExistente ? 'cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Iluminação</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('infraestrutura.coletaLixo')}
                      className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500 ${matriculaExistente ? 'cursor-not-allowed' : ''}`}
                      disabled={matriculaExistente || verificandoMatricula}
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
                    className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.objeto ? 'border-danger-500 focus:ring-danger-500' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={matriculaExistente || verificandoMatricula}
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
                    className={`input mt-1 w-full ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${matriculaExistente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={matriculaExistente || verificandoMatricula}
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
            disabled={isSubmitting || cadastrando || matriculaExistente || verificandoMatricula}
            className={`btn ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'btn-primary'} ${cadastrando ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {cadastrando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : matriculaExistente ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Matrícula já existe
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

      {/* Modal para adicionar valores personalizados */}
      <CustomValueModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={(valor) => {
          adicionarNovoValor(categoriaAtual, valor);
          setModalAberto(false);
        }}
        title={tituloModal}
        darkMode={darkMode} // Usando o tema atual da aplicação
      />
    </div>
  );
}