import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDatabaseStatus } from '../components/DatabaseStatus';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CustomizableSelect from '../components/CustomizableSelect';
import { ChevronRight, Save, X, Plus } from 'lucide-react';
import * as valoresPersonalizadosService from '../services/valoresPersonalizadosService';
import { OpcaoSelect, ValorPersonalizado } from '../services/valoresPersonalizadosService';
import { excluirValorPersonalizado } from '../services/valoresPersonalizadosService';
import CustomValueModal from '../components/CustomValueModal';
// Nota: Se react-toastify não estiver instalado, use o sistema de notificação existente
// import { toast } from 'react-toastify';
import { 
  ImovelFormData
} from '../types/imovel';
// Opções para os selects - arrays vazios para usar apenas valores personalizados
const opcoesDeFinaldiade: OpcaoSelect[] = [];

const opcoesDeTipoImovel: OpcaoSelect[] = [];

const opcoesDeStatusTransferencia: OpcaoSelect[] = [];

const opcoesDeTipoPosse: OpcaoSelect[] = [];

const opcoesDeTipoUsoEdificacao: OpcaoSelect[] = [];

import { obterImovelPorId, listarImoveisPrincipais, atualizarImovel } from '../services/imovelService';

export default function EditarImovel() {
  const { darkMode } = useTheme();
  const { isConnected } = useDatabaseStatus();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [imovel, setImovel] = useState<any>(null);
  const [imoveisPrincipais, setImoveisPrincipais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  
  // Estados para os valores personalizados
  const [valoresPersonalizadosFinalidade, setValoresPersonalizadosFinalidade] = useState<ValorPersonalizado[]>([]);
  const [valoresPersonalizadosTipoImovel, setValoresPersonalizadosTipoImovel] = useState<ValorPersonalizado[]>([]);
  const [valoresPersonalizadosTipoUsoEdificacao, setValoresPersonalizadosTipoUsoEdificacao] = useState<ValorPersonalizado[]>([]);
  const [valoresPersonalizadosTipoPosse, setValoresPersonalizadosTipoPosse] = useState<ValorPersonalizado[]>([]);
  const [valoresPersonalizadosStatusTransferencia, setValoresPersonalizadosStatusTransferencia] = useState<ValorPersonalizado[]>([]);
  
  // Estados para controlar os modais de valores personalizados
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  const [tituloModal, setTituloModal] = useState<string>('');
  const [carregandoValoresPersonalizados, setCarregandoValoresPersonalizados] = useState<boolean>(false);
  
  // Estados para as opções combinadas (padrão + personalizadas)
  const [opcoesFinaldiade, setOpcoesFinaldiade] = useState<OpcaoSelect[]>(opcoesDeFinaldiade);
  const [opcoesTipoImovel, setOpcoesTipoImovel] = useState<OpcaoSelect[]>(opcoesDeTipoImovel);
  const [opcoesTipoUsoEdificacao, setOpcoesTipoUsoEdificacao] = useState<OpcaoSelect[]>(opcoesDeTipoUsoEdificacao);
  const [opcoesTipoPosse, setOpcoesTipoPosse] = useState<OpcaoSelect[]>(opcoesDeTipoPosse);
  const [opcoesStatusTransferencia, setOpcoesStatusTransferencia] = useState<OpcaoSelect[]>(opcoesDeStatusTransferencia);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue, setError: setFormError } = useForm<ImovelFormData>({
    mode: 'onBlur', // Validar ao perder o foco para melhor experiência do usuário
    shouldFocusError: true // Focar automaticamente no primeiro campo com erro
  });
  
  // Função para excluir um valor personalizado
  const handleDeleteCustomValue = async (categoria: string, valorToDelete: string) => {
    try {
      console.log(`Excluindo valor personalizado: ${valorToDelete} da categoria ${categoria}`);
      
      // Buscar os valores personalizados para encontrar o ID do valor a ser excluído
      const valoresPersonalizados = await valoresPersonalizadosService.buscarValoresPersonalizados(categoria);
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
      // Mostrar mensagem de sucesso temporária
      setMensagemSucesso('Valor personalizado excluído com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } catch (error) {
      console.error('Erro ao excluir valor personalizado:', error);
      // Mostrar mensagem de erro temporária
      setError('Erro ao excluir valor personalizado. Tente novamente.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Função para abrir o modal de valor personalizado
  const abrirModalValorPersonalizado = (categoria: string) => {
    let titulo = '';
    switch (categoria) {
      case 'Finalidade':
        titulo = 'Nova Finalidade';
        break;
      case 'TipoImovel':
        titulo = 'Novo Tipo de Imóvel';
        break;
      case 'TipoUsoEdificacao':
        titulo = 'Novo Tipo de Uso da Edificação';
        break;
      case 'TipoPosse':
        titulo = 'Novo Tipo de Posse';
        break;
      case 'StatusTransferencia':
        titulo = 'Novo Status de Transferência';
        break;
      default:
        titulo = 'Novo Valor Personalizado';
    }
    setTituloModal(titulo);
    setModalAberto(categoria);
  };
  
  // Função para adicionar um novo valor personalizado
  const adicionarNovoValor = async (categoria: string, valor: string) => {
    if (!valor.trim()) return;
    try {
      setCarregandoValoresPersonalizados(true);
      await valoresPersonalizadosService.adicionarValorPersonalizado(categoria, valor.trim());
      
      // Atualizar a lista de valores personalizados
      const valoresAtualizados = await valoresPersonalizadosService.buscarValoresPersonalizados(categoria);
      
      // Encontrar o valor recém-adicionado nos valores atualizados
      const novoValorAdicionado = valoresAtualizados.find(v => 
        (v.valor || v.Valor) === valor.trim()
      );
      
      if (novoValorAdicionado) {
        const valorId = novoValorAdicionado.id || novoValorAdicionado.Id;
        const valorLabel = novoValorAdicionado.valor || novoValorAdicionado.Valor;
        
        switch (categoria) {
          case 'Finalidade':
            setValoresPersonalizadosFinalidade(valoresAtualizados);
            setOpcoesFinaldiade([
              ...opcoesDeFinaldiade,
              ...valoresAtualizados.map(v => ({
                value: (v.id || v.Id) as string,
                label: (v.valor || v.Valor) as string,
                personalizado: true
              }))
            ]);
            // Selecionar automaticamente o novo valor adicionado
            setTimeout(() => {
              setValue('finalidade', valorId as any);
            }, 100);
            break;
          case 'TipoImovel':
            setValoresPersonalizadosTipoImovel(valoresAtualizados);
            setOpcoesTipoImovel([
              ...opcoesDeTipoImovel,
              ...valoresAtualizados.map(v => ({
                value: (v.id || v.Id) as string,
                label: (v.valor || v.Valor) as string,
                personalizado: true
              }))
            ]);
            // Selecionar automaticamente o novo valor adicionado
            setTimeout(() => {
              setValue('tipoImovel', valorId as any);
            }, 100);
            break;
          case 'TipoUsoEdificacao':
            setValoresPersonalizadosTipoUsoEdificacao(valoresAtualizados);
            setOpcoesTipoUsoEdificacao([
              ...opcoesDeTipoUsoEdificacao,
              ...valoresAtualizados.map(v => ({
                value: (v.id || v.Id) as string,
                label: (v.valor || v.Valor) as string,
                personalizado: true
              }))
            ]);
            // Selecionar automaticamente o novo valor adicionado
            setTimeout(() => {
              setValue('tipoUsoEdificacao', valorId as any);
            }, 100);
            break;
          case 'TipoPosse':
            setValoresPersonalizadosTipoPosse(valoresAtualizados);
            setOpcoesTipoPosse([
              ...opcoesDeTipoPosse,
              ...valoresAtualizados.map(v => ({
                value: (v.id || v.Id) as string,
                label: (v.valor || v.Valor) as string,
                personalizado: true
              }))
            ]);
            // Selecionar automaticamente o novo valor adicionado
            setTimeout(() => {
              setValue('tipoPosse', valorId as any);
            }, 100);
            break;
          // Adicionar outros casos conforme necessário
          case 'StatusTransferencia':
            setValoresPersonalizadosStatusTransferencia(valoresAtualizados);
            setOpcoesStatusTransferencia(valoresPersonalizadosService.combinarValores(opcoesDeStatusTransferencia, valoresAtualizados));
            setTimeout(() => {
              setValue('statusTransferencia', valorLabel as any);
            }, 100);
            break;
        }
      } else {
        // Se não encontrar o novo valor, apenas atualizar as opções
        switch (categoria) {
          case 'Finalidade':
            setValoresPersonalizadosFinalidade(valoresAtualizados);
            setOpcoesFinaldiade(valoresPersonalizadosService.combinarValores(opcoesDeFinaldiade, valoresAtualizados));
            break;
          case 'TipoImovel':
            setValoresPersonalizadosTipoImovel(valoresAtualizados);
            setOpcoesTipoImovel(valoresPersonalizadosService.combinarValores(opcoesDeTipoImovel, valoresAtualizados));
            break;
          case 'TipoUsoEdificacao':
            setValoresPersonalizadosTipoUsoEdificacao(valoresAtualizados);
            setOpcoesTipoUsoEdificacao(valoresPersonalizadosService.combinarValores(opcoesDeTipoUsoEdificacao, valoresAtualizados));
            break;
          case 'TipoPosse':
            setValoresPersonalizadosTipoPosse(valoresAtualizados);
            setOpcoesTipoPosse(valoresPersonalizadosService.combinarValores(opcoesDeTipoPosse, valoresAtualizados));
            break;
          case 'StatusTransferencia':
            setValoresPersonalizadosStatusTransferencia(valoresAtualizados);
            setOpcoesStatusTransferencia(valoresPersonalizadosService.combinarValores(opcoesDeStatusTransferencia, valoresAtualizados));
            break;
        }
      }

      // Exibir mensagem de sucesso
      // Se estiver usando react-toastify: toast.success('Valor adicionado com sucesso!');
      setMensagemSucesso('Valor personalizado adicionado com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
      setCarregandoValoresPersonalizados(false);
    } catch (err) {
      console.error('Erro ao adicionar valor personalizado:', err);
      // Se estiver usando react-toastify: toast.error('Erro ao adicionar valor personalizado');
      setError('Erro ao adicionar valor personalizado. Tente novamente.');
      setTimeout(() => setError(''), 3000);
      setCarregandoValoresPersonalizados(false);
    }
  };
  
  // Efeito para carregar os valores personalizados ao montar o componente
  useEffect(() => {
    const carregarValoresPersonalizados = async () => {
      try {
        console.log('Carregando valores personalizados...');
        
        // Carregar valores personalizados para cada categoria
        const finalidade = await valoresPersonalizadosService.buscarValoresPersonalizados('Finalidade');
        const tipoImovel = await valoresPersonalizadosService.buscarValoresPersonalizados('TipoImovel');
        const tipoUsoEdificacao = await valoresPersonalizadosService.buscarValoresPersonalizados('TipoUsoEdificacao');
        const tipoPosse = await valoresPersonalizadosService.buscarValoresPersonalizados('TipoPosse');
        const statusTransferencia = await valoresPersonalizadosService.buscarValoresPersonalizados('StatusTransferencia');
        
        console.log('Valores personalizados recebidos:');
        console.log('Finalidade:', finalidade);
        console.log('TipoImovel:', tipoImovel);
        console.log('TipoUsoEdificacao:', tipoUsoEdificacao);
        console.log('TipoPosse:', tipoPosse);
        console.log('StatusTransferencia:', statusTransferencia);
        
        // Atualizar os estados
        setValoresPersonalizadosFinalidade(finalidade);
        setValoresPersonalizadosTipoImovel(tipoImovel);
        setValoresPersonalizadosTipoUsoEdificacao(tipoUsoEdificacao);
        setValoresPersonalizadosTipoPosse(tipoPosse);
        setValoresPersonalizadosStatusTransferencia(statusTransferencia);
        
        // Combinar valores padrão com personalizados
        setOpcoesFinaldiade(valoresPersonalizadosService.combinarValores(opcoesDeFinaldiade, finalidade));
        setOpcoesTipoImovel(valoresPersonalizadosService.combinarValores(opcoesDeTipoImovel, tipoImovel));
        setOpcoesTipoUsoEdificacao(valoresPersonalizadosService.combinarValores(opcoesDeTipoUsoEdificacao, tipoUsoEdificacao));
        setOpcoesTipoPosse(valoresPersonalizadosService.combinarValores(opcoesDeTipoPosse, tipoPosse));
        setOpcoesStatusTransferencia(valoresPersonalizadosService.combinarValores(opcoesDeStatusTransferencia, statusTransferencia));
        
        // Verificar se os valores foram combinados corretamente
        console.log('Valores combinados:');
        console.log('Finalidade:', valoresPersonalizadosService.combinarValores(opcoesDeFinaldiade, finalidade));
        console.log('TipoImovel:', valoresPersonalizadosService.combinarValores(opcoesDeTipoImovel, tipoImovel));
        console.log('TipoUsoEdificacao:', valoresPersonalizadosService.combinarValores(opcoesDeTipoUsoEdificacao, tipoUsoEdificacao));
        console.log('TipoPosse:', valoresPersonalizadosService.combinarValores(opcoesDeTipoPosse, tipoPosse));
        console.log('StatusTransferencia:', valoresPersonalizadosService.combinarValores(opcoesDeStatusTransferencia, statusTransferencia));
      } catch (error) {
        console.error('Erro ao carregar valores personalizados:', error);
      }
    };
    
    carregarValoresPersonalizados();
  }, []);
  
  // Carregar dados do imóvel
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar imóvel
        if (id) {
          const imovelData = await obterImovelPorId(id);
          setImovel(imovelData);
          
          // Processar matrículas originadas (pode vir como string ou array)
          let matriculasOriginadasFormatted = '';
          if (imovelData.matriculasOriginadas) {
            if (Array.isArray(imovelData.matriculasOriginadas)) {
              matriculasOriginadasFormatted = imovelData.matriculasOriginadas.join(', ');
            } else if (typeof imovelData.matriculasOriginadas === 'string') {
              matriculasOriginadasFormatted = imovelData.matriculasOriginadas;
            }
          }
          
          // Preencher formulário com dados do imóvel
          reset({
            matricula: imovelData.matricula,
            localizacao: imovelData.localizacao,
            area: imovelData.area,
            objeto: imovelData.objeto,
            matriculasOriginadas: matriculasOriginadasFormatted,
            observacao: imovelData.observacao || '',
            finalidade: imovelData.finalidade || 'Residencial',
            tipoImovel: imovelData.tipoImovel || 'Terreno',
            statusTransferencia: imovelData.statusTransferencia || '',
            imovelPaiId: imovelData.imovelPaiId || null,
            // Campos adicionais
            valorVenal: imovelData.valorVenal || 0,
            registroIPTU: imovelData.registroIPTU || '',
            latitude: imovelData.latitude || '',
            longitude: imovelData.longitude || '',
            tipoUsoEdificacao: imovelData.tipoUsoEdificacao || 'Residencial',
            tipoPosse: imovelData.tipoPosse || 'Proprietário',
            pontoReferencia: imovelData.pontoReferencia || '',
            // Infraestrutura
            infraestrutura: {
              agua: Boolean(imovelData.infraestrutura?.agua) || false,
              esgoto: Boolean(imovelData.infraestrutura?.esgoto) || false,
              energia: Boolean(imovelData.infraestrutura?.energia) || false,
              pavimentacao: Boolean(imovelData.infraestrutura?.pavimentacao) || false,
              iluminacao: Boolean(imovelData.infraestrutura?.iluminacao) || false,
              coletaLixo: Boolean(imovelData.infraestrutura?.coletaLixo) || false
            }
          });
          
          // Carregar imóveis principais
          const principais = await listarImoveisPrincipais();
          setImoveisPrincipais(principais.filter(imovel => imovel.id !== id));
        } else {
          // Redirecionar se não houver ID
          navigate('/imoveis');
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados do imóvel. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [id, reset, navigate]);
  
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
        setFormError(campo as any, {
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

  const onSubmit = async (data: ImovelFormData) => {
    // Verificar se o banco de dados está conectado
    if (!isConnected) {
      setError('Não é possível editar imóveis enquanto o banco de dados estiver desconectado. Entre em contato com o setor de T.I.');
      return;
    }
    
    // Validar campos de seleção antes de prosseguir
    if (!validarCamposSelecao(data)) {
      return; // Interromper o envio se a validação falhar
    }
    
    try {
      setSalvando(true);
      setError(null);
      setMensagemSucesso(null);
      
      // Processar matrículas originadas se for uma string
      if (typeof data.matriculasOriginadas === 'string' && data.matriculasOriginadas.trim()) {
        data.matriculasOriginadas = data.matriculasOriginadas
          .split(',')
          .map(m => m.trim())
          .filter(m => m.length > 0);
      }
      
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
          agua: Boolean(data.infraestrutura?.agua),
          esgoto: Boolean(data.infraestrutura?.esgoto),
          energia: Boolean(data.infraestrutura?.energia),
          pavimentacao: Boolean(data.infraestrutura?.pavimentacao),
          iluminacao: Boolean(data.infraestrutura?.iluminacao),
          coletaLixo: Boolean(data.infraestrutura?.coletaLixo)
        }
      };
      
      console.log('Enviando dados atualizados:', formData);
      console.log('Infraestrutura convertida para booleanos:', formData.infraestrutura);
      
      // Chamar o serviço para atualizar o imóvel
      const sucesso = await atualizarImovel(id, formData);
      
      if (sucesso) {
        setMensagemSucesso('Imóvel atualizado com sucesso!');
        
        // Redirecionar para detalhes após 1.5 segundos
        setTimeout(() => {
          navigate(`/imoveis/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao atualizar imóvel:', err);
      setError(err.message || 'Erro ao atualizar imóvel. Tente novamente mais tarde.');
    } finally {
      setSalvando(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Carregando informações do imóvel...</p>
      </div>
    );
  }
  
  if (!imovel) return null;
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mensagens de erro ou sucesso */}
      {error && (
        <div className={`mb-4 rounded-md p-4 ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800'}`}>
          {error}
        </div>
      )}
      
      {mensagemSucesso && (
        <div className={`mb-4 rounded-md p-4 ${darkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-800'}`}>
          {mensagemSucesso}
        </div>
      )}
      
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-x-2 text-xs">
          <Link to="/imoveis" className={`hover:text-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Imóveis
          </Link>
          <ChevronRight className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <Link to={`/imoveis/${id}`} className={`hover:text-gray-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {imovel.matricula}
          </Link>
          <ChevronRight className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>Editar</span>
        </div>
        <h1 className={`mt-1 text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Editar Imóvel</h1>
      </div>
      
      {/* Formulário */}
      <form 
        onSubmit={handleSubmit(onSubmit, (errors) => {
          // Callback de erro do formulário - executa quando há erros de validação
          console.error('Erros de validação:', errors);
          // Scroll para o primeiro elemento com erro
          setTimeout(() => {
            const elementosComErro = document.querySelectorAll('.border-danger-500');
            if (elementosComErro.length > 0) {
              elementosComErro[0].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 100);
        })} 
        className="space-y-6"
      >
        <div className={`card p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : ''}`}>
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
                  type="text"
                  inputMode="decimal"
                  id="area"
                  className={`input mt-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.area ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  {...register('area', { 
                    required: 'Área é obrigatória',
                    validate: (value) => {
                      // Converte a string para número, tratando vírgula como separador decimal
                      const areaValue = parseFloat(value.toString().replace(',', '.'));
                      return !isNaN(areaValue) && areaValue > 0 || 'Área deve ser um número maior que zero';
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
                    className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.finalidade ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Selecione uma finalidade"
                    required
                    onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('Finalidade', deletedValue)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirModalValorPersonalizado('Finalidade')}
                    className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
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
                    className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoImovel ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Selecione um tipo de imóvel"
                    required
                    onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('TipoImovel', deletedValue)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirModalValorPersonalizado('TipoImovel')}
                    className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errors.tipoImovel && (
                  <p className="mt-1 text-xs text-danger-600">{errors.tipoImovel.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="tipoUsoEdificacao" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Tipo de Uso da Edificação*
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
                    className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoUsoEdificacao ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Selecione um tipo de uso"
                    required
                    onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('TipoUsoEdificacao', deletedValue)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirModalValorPersonalizado('TipoUsoEdificacao')}
                    className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
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
                    className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.tipoPosse ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Selecione um tipo de posse"
                    required
                    onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('TipoPosse', deletedValue)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirModalValorPersonalizado('TipoPosse')}
                    className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
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
                    className={`input mt-1 flex-grow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''} ${errors.statusTransferencia ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Selecione um status"
                    required
                    onCustomValueDeleted={(deletedValue) => handleDeleteCustomValue('StatusTransferencia', deletedValue)}
                  />
                  <button
                    type="button"
                    onClick={() => abrirModalValorPersonalizado('StatusTransferencia')}
                    className={`mt-1 px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {errors.statusTransferencia && (
                  <p className="mt-1 text-xs text-danger-600">{errors.statusTransferencia.message}</p>
                )}
              </div>
            </div>
            <div className="mt-6">
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
                Informe as matrículas originadas deste imóvel.
              </p>
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
            
            {/* Seção 5: Descrição */}
            <div>
              <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Descrição</h3>
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
            
            {/* Seção 4: Infraestrutura */}
            <div>
              <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Infraestrutura Disponível</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('infraestrutura.agua')}
                    className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Água</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('infraestrutura.esgoto')}
                    className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Esgoto</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('infraestrutura.energia')}
                    className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Energia</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('infraestrutura.pavimentacao')}
                    className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Pavimentação</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('infraestrutura.iluminacao')}
                    className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Iluminação</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('infraestrutura.coletaLixo')}
                    className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} text-primary-600 focus:ring-primary-500`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Coleta de Lixo</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Link to={`/imoveis/${id}`} className={`btn ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'btn-secondary'}`}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting || salvando}
            className={`btn ${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'btn-primary'} ${salvando ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {salvando ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
      
      {/* Modal para adicionar valores personalizados */}
      <CustomValueModal
        isOpen={modalAberto !== null}
        onClose={() => setModalAberto(null)}
        onSave={(valor) => {
          if (modalAberto) {
            adicionarNovoValor(modalAberto, valor);
          }
        }}
        title={tituloModal}
        darkMode={darkMode}
      />
    </div>
  );
}