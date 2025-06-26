import { useState, useEffect } from 'react';
import { Database, User, Folder, Settings, Save, RefreshCw, UserPlus, Edit, Trash2, X, Eye, EyeOff, Plus, RefreshCcw, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from '../components/Toast';
import { testConnection } from '../lib/db';
import { Usuario, UsuarioFormData } from '../types/usuario';
import { listarUsuarios, cadastrarUsuario, atualizarUsuario, excluirUsuario, isUsingMasterCredentials } from '../services/usuarioService';
import { excluirImovel, buscarImoveis } from '../services/imovelService';

// Interface para diretórios de documentos
interface DocumentosConfig {
  diretoriosDocumentos: string[];
}

// Componente para gerenciar diretórios de documentos
const DocumentosConfig = () => {
  const [diretoriosDocumentos, setDiretoriosDocumentos] = useState<string[]>([]);
  const [novoDiretorio, setNovoDiretorio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Carregar a configuração dos diretórios de documentos
  useEffect(() => {
    const carregarDiretorios = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/documentos/config');
        
        if (response.ok) {
          const config: DocumentosConfig = await response.json();
          setDiretoriosDocumentos(config.diretoriosDocumentos || []);
        } else {
          setError('Erro ao carregar configurações de diretórios');
        }
      } catch (err) {
        console.error('Erro ao carregar diretórios:', err);
        setError('Erro ao carregar diretórios de documentos');
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDiretorios();
  }, []);
  
  // Adicionar um novo diretório
  const adicionarDiretorio = () => {
    if (!novoDiretorio) return;
    if (diretoriosDocumentos.includes(novoDiretorio)) {
      setError('Este diretório já está na lista');
      return;
    }
    
    setDiretoriosDocumentos([...diretoriosDocumentos, novoDiretorio]);
    setNovoDiretorio('');
    setError(null);
  };
  
  // Remover um diretório
  const removerDiretorio = (diretorio: string) => {
    setDiretoriosDocumentos(diretoriosDocumentos.filter(d => d !== diretorio));
  };
  
  // Salvar a configuração
  const salvarConfiguracao = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const response = await fetch('/api/documentos/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diretoriosDocumentos }),
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao salvar configurações de diretórios');
      }
    } catch (err) {
      console.error('Erro ao salvar diretórios:', err);
      setError('Erro ao salvar diretórios');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuração de Diretórios de Documentos</h2>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure os diretórios onde o sistema deve buscar por documentos. Quando um caminho relativo for informado, 
          o sistema tentará localizar o arquivo em cada um desses diretórios.  
        </p>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-2 w-32 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        ) : (
          <div>
            {/* Lista de diretórios */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Diretórios configurados:</h3>
              
              {diretoriosDocumentos.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic p-2">Nenhum diretório configurado</div>
              ) : (
                <ul className="space-y-2">
                  {diretoriosDocumentos.map((diretorio, index) => (
                    <li key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded-md border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <Folder className="h-5 w-5 text-gray-500 dark:text-gray-200 mr-2" />
                        <span className="text-sm truncate max-w-md">{diretorio}</span>
                      </div>
                      <button 
                        type="button"
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500"
                        onClick={() => removerDiretorio(diretorio)}
                        title="Remover diretório"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Formulário para adicionar diretório */}
            <div className="mt-4">
              <label htmlFor="novo-diretorio" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Adicionar novo diretório
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <div className="relative flex items-stretch flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Folder className="h-5 w-5 text-gray-400 dark:text-gray-200" />
                  </div>
                  <input
                    type="text"
                    id="novo-diretorio"
                    className="input pl-10"
                    placeholder="Ex: C:\Users\Documentos"
                    value={novoDiretorio}
                    onChange={(e) => setNovoDiretorio(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  onClick={adicionarDiretorio}
                >
                  <Plus className="h-4 w-4 mr-2" />Adicionar
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Digite o caminho completo do diretório</p>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
                {error}
              </div>
            )}
            
            {saveSuccess && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
                Configurações salvas com sucesso!
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className={`btn ${isSaving ? 'opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600' : 'btn-primary dark:btn-primary-dark'}`}
                onClick={salvarConfiguracao}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Configuracoes() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'banco' | 'usuarios' | 'documentos' | 'geral' | 'restaurar'>('banco');
  const [dbConfig, setDbConfig] = useState({
    server: '',
    port: '',
    database: '',
    user: '',
    password: '',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  });

  // Carregar configurações do banco ao montar o componente
  useEffect(() => {
    const fetchDbConfig = async () => {
      try {
        const response = await fetch('/api/db-config');
        if (response.ok) {
          const config = await response.json();
          setDbConfig(config);
        } else {
          console.error('Erro ao buscar configurações do banco');
        }
      } catch (err) {
        console.error('Erro ao buscar configurações do banco:', err);
      }
    };

    fetchDbConfig();
  }, []);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  
  // Estados para gerenciamento de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuarioForm, setUsuarioForm] = useState<UsuarioFormData>({
    nome: '',
    nomeUsuario: '',
    senha: '',
    cargo: 'Usuário',
    ativo: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUsuarioId, setDeletingUsuarioId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para exclusão em massa de imóveis
  const [showConfirmacaoExclusao, setShowConfirmacaoExclusao] = useState(false);
  const [excluindoImoveis, setExcluindoImoveis] = useState(false);
  const [resultadoExclusao, setResultadoExclusao] = useState<{
    sucesso: boolean;
    mensagem: string;
    total: number;
    excluidos: number;
    erros?: string[];
  } | null>(null);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const success = await testConnection();
      setTestStatus(success ? 'success' : 'error');
    } catch (err) {
      setTestStatus('error');
    }
  };

  const handleSaveConfig = async () => {
    setSaveStatus('saving');
    setErrorMessage('');
    try {
      const configToSave = {
        server: dbConfig.server,
        port: parseInt(dbConfig.port.toString()),
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password,
        options: dbConfig.options
      };

      const response = await fetch('/api/db-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });

      try {
        const result = await response.json();
        if (result.success) {
          setSaveStatus('success');
          setTestStatus('success');
          setConnectionStatus(result.connectionStatus || 'Conectado com sucesso');
          
          // Aguardar 3 segundos e recarregar a página
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setSaveStatus('error');
          setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
        }
      } catch (jsonError) {
        // Se houver erro ao fazer parse do JSON, pode ser que o servidor esteja reiniciando
        if (response.ok) {
          setSaveStatus('success');
          setTestStatus('success');
          setConnectionStatus('Servidor reiniciando, aguarde...');
          
          // Aguardar 3 segundos e recarregar a página
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setSaveStatus('error');
          setErrorMessage('Erro ao processar resposta do servidor. Tente novamente.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setSaveStatus('error');
      setErrorMessage('Erro ao salvar configurações: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };
  
  // Carregar usuários ao abrir a aba
  useEffect(() => {
    if (activeTab === 'usuarios') {
      carregarUsuarios();
    }
  }, [activeTab]);
  
  // Função para carregar usuários
  const carregarUsuarios = async () => {
    try {
      const usuariosData = await listarUsuarios();
      setUsuarios(usuariosData);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      // Usar dados mockados para desenvolvimento
      setUsuarios([
        {
          id: '1',
          nome: 'Administrador',
          nomeUsuario: 'admin',
          cargo: 'Administrador',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ultimoLogin: new Date().toISOString()
        },
        {
          id: '2',
          nome: 'Usuário Teste',
          nomeUsuario: 'usuario',
          cargo: 'Usuário',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          ultimoLogin: null
        }
      ]);
    }
  };
  
  // Função para lidar com a edição de usuário
  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setUsuarioForm({
      nome: usuario.nome,
      nomeUsuario: usuario.nomeUsuario,
      senha: '', // Não preencher a senha na edição
      cargo: usuario.cargo,
      ativo: usuario.ativo
    });
    setShowUsuarioForm(true);
  };
  
  // Função para lidar com a exclusão de usuário
  const handleDeleteUsuario = (id: string) => {
    setDeletingUsuarioId(id);
    setShowDeleteConfirm(true);
  };
  
  // Função para confirmar a exclusão de usuário
  const confirmDeleteUsuario = async () => {
    if (!deletingUsuarioId) return;
    
    setIsDeleting(true);
    try {
      await excluirUsuario(deletingUsuarioId);
      setUsuarios(usuarios.filter(u => u.id !== deletingUsuarioId));
      setShowDeleteConfirm(false);
      toast.success('Usuário excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      toast.error('Erro ao excluir usuário. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setDeletingUsuarioId(null);
    }
  };
  
  // Função para excluir todos os imóveis
  const excluirTodosImoveis = async () => {
    setExcluindoImoveis(true);
    setResultadoExclusao(null);
    
    try {
      // Buscar todos os imóveis
      const imoveis = await buscarImoveis();
      const total = imoveis.length;
      
      if (total === 0) {
        setResultadoExclusao({
          sucesso: true,
          mensagem: 'Não há imóveis cadastrados para excluir.',
          total: 0,
          excluidos: 0
        });
        setExcluindoImoveis(false);
        setShowConfirmacaoExclusao(false);
        return;
      }
      
      let excluidos = 0;
      let erros = [];
      
      // Excluir cada imóvel com cascata (para garantir que imóveis secundários também sejam excluídos)
      for (const imovel of imoveis) {
        try {
          await excluirImovel(imovel.id, true); // true para exclusão em cascata
          excluidos++;
        } catch (error) {
          console.error(`Erro ao excluir imóvel ${imovel.id}:`, error);
          erros.push(imovel.id);
        }
      }
      
      // Exibir resultado
      setResultadoExclusao({
        sucesso: excluidos === total,
        mensagem: excluidos === total 
          ? `Todos os ${total} imóveis foram excluídos com sucesso.` 
          : `${excluidos} de ${total} imóveis foram excluídos. ${erros.length} imóveis não puderam ser excluídos.`,
        total,
        excluidos,
        erros
      });
      
      // Exibir toast com o resultado
      if (excluidos === total) {
        toast.success(`Todos os ${total} imóveis foram excluídos com sucesso.`);
      } else {
        toast.info(`${excluidos} de ${total} imóveis foram excluídos. ${erros.length} imóveis não puderam ser excluídos.`);
      }
      
      setShowConfirmacaoExclusao(false);
    } catch (error) {
      console.error('Erro ao excluir todos os imóveis:', error);
      setResultadoExclusao({
        sucesso: false,
        mensagem: 'Ocorreu um erro ao tentar excluir os imóveis. Por favor, tente novamente.',
        total: 0,
        excluidos: 0
      });
      
      toast.error('Ocorreu um erro ao tentar excluir os imóveis. Por favor, tente novamente.');
    } finally {
      setExcluindoImoveis(false);
    }
  };
  
  // Função para lidar com mudanças no formulário
  const handleUsuarioFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setUsuarioForm(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setUsuarioForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Função para lidar com o envio do formulário
  const handleUsuarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      if (editingUsuario) {
        // Atualizar usuário existente
        const usuarioAtualizado = await atualizarUsuario(editingUsuario.id, {
          ...usuarioForm,
          // Se a senha estiver vazia, não enviá-la
          senha: usuarioForm.senha ? usuarioForm.senha : undefined
        });
        
        setUsuarios(prev => 
          prev.map(u => u.id === usuarioAtualizado.id ? usuarioAtualizado : u)
        );
      } else {
        // Criar novo usuário
        const novoUsuario = await cadastrarUsuario(usuarioForm);
        setUsuarios(prev => [...prev, novoUsuario]);
      }
      
      // Resetar formulário e fechar modal
      setUsuarioForm({
        nome: '',
        nomeUsuario: '',
        senha: '',
        cargo: 'Usuário',
        ativo: true
      });
      setShowUsuarioForm(false);
      setEditingUsuario(null);
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setFormError(err.message || 'Erro ao salvar usuário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Verificar se está usando credenciais mestras
  const usingMasterCredentials = isUsingMasterCredentials();
  
  // Se estiver usando credenciais mestras, forçar a tab de banco de dados
  useEffect(() => {
    if (usingMasterCredentials) {
      setActiveTab('banco');
    }
  }, [usingMasterCredentials]);
  
  // Garantir que não seja possível mudar para outra tab quando estiver usando credenciais mestras
  useEffect(() => {
    if (usingMasterCredentials && activeTab !== 'banco') {
      setActiveTab('banco');
    }
  }, [activeTab, usingMasterCredentials]);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">
          {usingMasterCredentials 
            ? "Configurações de emergência - Acesso com credenciais mestras" 
            : "Gerencie as configurações do sistema de cadastro de imóveis."}
        </p>
        {usingMasterCredentials && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800">
            <p className="text-sm font-medium">Modo de emergência ativado</p>
            <p className="text-xs">Você está usando credenciais mestras. Apenas as configurações do banco de dados estão disponíveis.</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6">
        {/* Sidebar de navegação */}
        {!usingMasterCredentials ? (
          <div className="w-full md:w-64 shrink-0">
            <div className="card overflow-hidden">
              <nav className="flex flex-col">
                <button
                  onClick={() => setActiveTab('banco')}
                  className={`flex items-center gap-2 p-4 text-sm font-medium border-l-4 ${
                    activeTab === 'banco'
                      ? darkMode 
                        ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                        : 'bg-primary-50 border-primary-600 text-primary-700'
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:bg-gray-700/50'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Database className="h-5 w-5" />
                  Banco de Dados
                </button>
                
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`flex items-center gap-2 p-4 text-sm font-medium border-l-4 ${
                    activeTab === 'usuarios'
                      ? darkMode 
                        ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                        : 'bg-primary-50 border-primary-600 text-primary-700'
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:bg-gray-700/50'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  Usuários
                </button>
                
                <button
                  onClick={() => setActiveTab('restaurar')}
                  className={`flex items-center gap-2 p-4 text-sm font-medium border-l-4 ${
                    activeTab === 'restaurar'
                      ? darkMode 
                        ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                        : 'bg-primary-50 border-primary-600 text-primary-700'
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:bg-gray-700/50'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RefreshCcw className="h-5 w-5" />
                  Restaurar definições
                </button>

                <button
                  onClick={() => setActiveTab('documentos')}
                  className={`flex items-center gap-2 p-4 text-sm font-medium border-l-4 ${
                    activeTab === 'documentos'
                      ? darkMode 
                        ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                        : 'bg-primary-50 border-primary-600 text-primary-700'
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:bg-gray-700/50'
                        : 'border-transparent text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Folder className="h-5 w-5" />
                  Diretórios de Documentos
                </button>
              </nav>
            </div>
          </div>
        ) : null}
        
        {/* Conteúdo da tab */}
        <div className="flex-1">
          <div className="card p-6">
            {activeTab === 'geral' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Configurações Gerais</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="system-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nome do Sistema
                    </label>
                    <input
                      type="text"
                      id="system-name"
                      className="input mt-1"
                      defaultValue="Sistema de Cadastro de Imóveis"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      id="company-name"
                      className="input mt-1"
                      defaultValue="Minha Empresa"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email-contact" className="block text-sm font-medium text-gray-700">
                      Email de Contato
                    </label>
                    <input
                      type="email"
                      id="email-contact"
                      className="input mt-1"
                      defaultValue="contato@empresa.com"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'banco' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Configurações do Banco de Dados</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="db-server" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Servidor
                      </label>
                      <input
                        type="text"
                        id="db-server"
                        className="input mt-1"
                        value={dbConfig.server}
                        onChange={(e) => setDbConfig({ ...dbConfig, server: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="db-port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Porta
                      </label>
                      <input
                        type="text"
                        id="db-port"
                        className="input mt-1"
                        value={dbConfig.port}
                        onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="db-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome do Banco
                      </label>
                      <input
                        type="text"
                        id="db-name"
                        className="input mt-1"
                        value={dbConfig.database}
                        onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="db-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Usuário
                      </label>
                      <input
                        type="text"
                        id="db-user"
                        className="input mt-1"
                        value={dbConfig.user}
                        onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="db-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Senha
                      </label>
                      <input
                        type="password"
                        id="db-password"
                        className="input mt-1"
                        value={dbConfig.password}
                        onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        id="db-encrypt"
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={dbConfig.options.encrypt}
                        onChange={(e) => setDbConfig({
                          ...dbConfig,
                          options: { ...dbConfig.options, encrypt: e.target.checked }
                        })}
                      />
                      <label htmlFor="db-encrypt" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Usar conexão criptografada
                      </label>
                    </div>
                  </div>
                  
                  {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                      {errorMessage}
                    </div>
                  )}

                  {saveStatus === 'success' && (
                    <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
                      <p>Configurações salvas com sucesso! O servidor será reiniciado automaticamente.</p>
                      <p className="mt-2 font-semibold">{connectionStatus}</p>
                      <p className="mt-1 text-sm">Aguarde alguns segundos e recarregue a página.</p>
                    </div>
                  )}

                  {saveStatus === 'saving' && (
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full animate-pulse w-full"></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Salvando configurações e testando conexão...</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      className={`btn ${saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'btn-primary'}`}
                      onClick={handleSaveConfig}
                      disabled={saveStatus === 'saving'}
                    >
                      {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Configurações'}
                    </button>

                    <button 
                      type="button" 
                      className={`btn ${
                        testStatus === 'success' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : testStatus === 'error'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'btn-primary'
                      }`}
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                    >
                      {testStatus === 'testing' ? 'Testando...' :
                       testStatus === 'success' ? 'Conexão Bem-sucedida' :
                       testStatus === 'error' ? 'Falha na Conexão' :
                       'Testar Conexão'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'documentos' && (
              <DocumentosConfig />
            )}
            
            {activeTab === 'restaurar' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Restaurar Definições</h2>
                
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Excluir todos os imóveis</h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Esta ação irá excluir permanentemente todos os imóveis cadastrados no sistema, incluindo imóveis principais e secundários.
                            Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                          </p>
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            className="btn btn-danger flex items-center gap-2"
                            onClick={() => setShowConfirmacaoExclusao(true)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir todos os imóveis
                          </button>
                        </div>
                        
                        {resultadoExclusao && (
                          <div className={`mt-4 p-3 rounded-md ${resultadoExclusao.excluidos === resultadoExclusao.total ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                            <div className="flex">
                              <div className="flex-shrink-0">
                                {resultadoExclusao.excluidos === resultadoExclusao.total ? (
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                                )}
                              </div>
                              <div className="ml-3">
                                <h3 className={`text-sm font-medium ${resultadoExclusao.excluidos === resultadoExclusao.total ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                                  {resultadoExclusao.excluidos === resultadoExclusao.total ? 'Exclusão concluída com sucesso' : 'Exclusão concluída com avisos'}
                                </h3>
                                <div className={`mt-2 text-sm ${resultadoExclusao.excluidos === resultadoExclusao.total ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                  <p>
                                    {resultadoExclusao.excluidos === resultadoExclusao.total
                                      ? `Todos os ${resultadoExclusao.total} imóveis foram excluídos com sucesso.`
                                      : `${resultadoExclusao.excluidos} de ${resultadoExclusao.total} imóveis foram excluídos. ${resultadoExclusao.erros?.length || 0} imóveis não puderam ser excluídos.`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'usuarios' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Gerenciamento de Usuários</h2>
                  <button 
                    onClick={() => {
                      setEditingUsuario(null);
                      setUsuarioForm({
                        nome: '',
                        nomeUsuario: '',
                        senha: '',
                        cargo: 'Usuário',
                        ativo: true
                      });
                      setShowUsuarioForm(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Novo Usuário
                  </button>
                </div>
                
                {/* Lista de usuários */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome completo</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuário</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credencial</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{usuario.nome}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-300">{usuario.nomeUsuario}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.cargo === 'Administrador' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                              {usuario.cargo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditUsuario(usuario)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUsuario(usuario.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {usuarios.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Nenhum usuário encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Formulário de edição/criação de usuário */}
                {showUsuarioForm && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                        </h3>
                        <button 
                          onClick={() => setShowUsuarioForm(false)}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <form onSubmit={handleUsuarioSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome completo</label>
                          <input
                            type="text"
                            id="nome"
                            name="nome"
                            className="input mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={usuarioForm.nome}
                            onChange={handleUsuarioFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="nomeUsuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                          <input
                            type="text"
                            id="nomeUsuario"
                            name="nomeUsuario"
                            className="input mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={usuarioForm.nomeUsuario}
                            onChange={handleUsuarioFormChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Senha {editingUsuario && "(deixe em branco para manter a atual)"}
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              id="senha"
                              name="senha"
                              className="input mt-1 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={usuarioForm.senha}
                              onChange={handleUsuarioFormChange}
                              required={!editingUsuario}
                            />
                            <button 
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Credencial</label>
                          <select
                            id="cargo"
                            name="cargo"
                            className="input mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={usuarioForm.cargo}
                            onChange={handleUsuarioFormChange}
                            required
                          >
                            <option value="">Selecione um cargo</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Usuário">Usuário</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="ativo"
                            name="ativo"
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                            checked={usuarioForm.ativo}
                            onChange={handleUsuarioFormChange}
                          />
                          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Usuário ativo
                          </label>
                        </div>
                        
                        {formError && (
                          <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>
                        )}
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            className="btn btn-secondary dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                            onClick={() => setShowUsuarioForm(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                {/* Confirmação de exclusão */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={confirmDeleteUsuario}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação para exclusão em massa de imóveis */}
      {showConfirmacaoExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirmar exclusão</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Você está prestes a excluir <strong>todos os imóveis</strong> cadastrados no sistema. Esta ação não pode ser desfeita.
                  </p>
                  <p className="text-sm text-red-500 font-medium mt-2">
                    Deseja realmente prosseguir com a exclusão?  
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowConfirmacaoExclusao(false)}
                disabled={excluindoImoveis}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger flex items-center gap-2"
                onClick={excluirTodosImoveis}
                disabled={excluindoImoveis}
              >
                {excluindoImoveis ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Sim, excluir todos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}