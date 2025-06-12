import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Save, X, Loader2 } from 'lucide-react';
import { 
  ImovelFormData, Finalidade, TipoImovel, StatusTransferencia 
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

import { obterImovelPorId, listarImoveisPrincipais, atualizarImovel } from '../services/imovelService';

export default function EditarImovel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [imovel, setImovel] = useState(null);
  const [imoveisPrincipais, setImoveisPrincipais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ImovelFormData>();
  
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
  
  const onSubmit = async (data: ImovelFormData) => {
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
      
      // Garantir que os valores de infraestrutura sejam booleanos
      const formData = {
        ...data,
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                
                {/* Campo Imóvel Principal removido para evitar problemas */}
                <input type="hidden" {...register('imovelPaiId')} />

                <div>
                  <label htmlFor="matriculasOriginadas" className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Matrículas Originadas
                  </label>
                  <input
                    type="text"
                    id="matriculasOriginadas"
                    placeholder="Separadas por vírgula"
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
    </div>
  );
}