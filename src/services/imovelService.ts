import { Imovel, ImovelFormData } from '../types/imovel';
import { getCurrentUser } from './usuarioService';

// Dados vazios para fallback
const dadosVazios: Imovel[] = [];

// Configuração da API
const API_URL = 'http://localhost:3001/api';

// Variáveis para controlar o comportamento do serviço
let useEmptyData = false;
let useMockData = false; // Controla se devemos usar dados mockados em vez da API

// Função para verificar se o servidor backend está disponível
async function isBackendAvailable(): Promise<boolean> {
  try {
    console.log('Verificando disponibilidade do backend em:', `${API_URL}/test-connection`);
    const response = await fetch(`${API_URL}/test-connection`);
    const data = await response.json();
    console.log('Resposta do teste de conexão:', data);
    useEmptyData = !data.success;
    return data.success;
  } catch (err) {
    console.warn('Servidor backend não disponível, usando dados vazios:', err);
    useEmptyData = true;
    return false;
  }
}

// Verificar disponibilidade do backend ao inicializar
isBackendAvailable().then(available => {
  if (available) {
    console.log('Servidor backend disponível, usando API');
  } else {
    console.warn('Servidor backend não disponível, usando dados vazios');
  }
});

// Função para fazer requisições à API
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    // Verificar se devemos usar dados vazios
    if (useEmptyData) {
      console.log('fetchApi: Usando dados vazios para', endpoint);
      throw new Error('Usando dados vazios');
    }
    
    console.log('fetchApi: Chamando', `${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    console.log(`fetchApi: Resposta para ${endpoint}:`, response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`fetchApi: Dados recebidos para ${endpoint}:`, data);
    return data;
  } catch (err) {
    console.error(`Erro ao chamar API ${endpoint}:`, err);
    useEmptyData = true; // Ativar modo de dados vazios
    throw err;
  }
}


// Serviço para listar todos os imóveis principais
export async function listarImoveisPrincipais(): Promise<Imovel[]> {
  console.log('listarImoveisPrincipais: Buscando imóveis principais');
  
  // Verificar se devemos usar dados vazios
  if (useEmptyData) {
    console.log('listarImoveisPrincipais: Usando dados vazios');
    return dadosVazios;
  }
  
  try {
    console.log('listarImoveisPrincipais: Buscando imóveis principais da API');
    const imoveisAPI = await fetchApi('/imoveis?apenasPrincipais=true');
    console.log('listarImoveisPrincipais: Dados brutos da API:', imoveisAPI);
    
    // Mapear os dados da API para o formato esperado pelo frontend
    const imoveis = Array.isArray(imoveisAPI) 
      ? imoveisAPI.map(imovelAPI => mapearImovelDaAPI(imovelAPI))
      : [];
    
    console.log('listarImoveisPrincipais: Imóveis principais mapeados:', imoveis.length);
    return imoveis;
  } catch (err) {
    console.error('listarImoveisPrincipais: Erro ao listar imóveis principais:', err);
    
    // Tentar usar dados mockados como fallback
    console.log('listarImoveisPrincipais: Tentando usar dados mockados como fallback');
    useMockData = true;
    const imoveisPrincipais = mockImoveis.filter(imovel => imovel.imovelPaiId === null);
    return imoveisPrincipais;
  }
}

// Serviço para obter um imóvel por ID
export async function obterImovelPorId(id: string | number): Promise<Imovel> {
  console.log('obterImovelPorId: Buscando imóvel com ID:', id);
  
  // Verificar se devemos usar dados vazios
  if (useEmptyData) {
    console.log('obterImovelPorId: Backend não disponível');
    throw new Error(`Imóvel com ID ${id} não encontrado - Backend não disponível`);
  }
  
  try {
    const imovelAPI = await fetchApi(`/imoveis/${id}`);
    console.log('obterImovelPorId: Dados brutos da API:', imovelAPI);
    
    // Mapear os dados da API para o formato esperado pelo frontend
    const imovel = mapearImovelDaAPI(imovelAPI);
    
    // Garantir que o imóvel tenha a propriedade documentos como um array vazio
    if (!imovel.documentos) {
      imovel.documentos = [];
    }
    
    console.log('obterImovelPorId: Imóvel mapeado:', imovel);
    return imovel;
  } catch (err) {
    console.error('obterImovelPorId: Erro ao obter imóvel por ID:', err);
    
    // Marcar que o backend não está disponível
    console.log('obterImovelPorId: Erro ao acessar o backend');
    useEmptyData = true;
    throw new Error(`Imóvel com ID ${id} não encontrado - Erro ao acessar o backend`);
  
  }
}

// Serviço para cadastrar um novo imóvel
export async function cadastrarImovel(imovel: ImovelFormData): Promise<string> {
  // Obter dados do usuário logado
  const usuarioAtual = getCurrentUser();
  
  // Adicionar informações do usuário ao imóvel
  if (usuarioAtual) {
    imovel.usuarioCadastroId = usuarioAtual.id;
    imovel.usuarioCadastroNome = usuarioAtual.nome;
    console.log('Adicionando assinatura do usuário ao cadastro:', usuarioAtual.nome);
  } else {
    console.warn('Nenhum usuário logado. Cadastro será feito sem assinatura de usuário.');
  }
  
  // Verificar se o backend está disponível
  const backendAvailable = await isBackendAvailable();
  
  // Se o backend não estiver disponível e estamos configurados para usar dados mockados
  if (!backendAvailable && useMockData) {
    console.log('Usando dados mockados para cadastrarImovel');
    // Simular um ID gerado
    const novoId = Math.floor(Math.random() * 1000).toString();
    console.log(`Imóvel cadastrado com ID mockado: ${novoId}`);
    return novoId;
  }
  
  try {
    const response = await fetchApi('/imoveis', {
      method: 'POST',
      body: JSON.stringify(imovel)
    });
    
    return response.id;
  } catch (err: any) {
    console.error('Erro ao cadastrar imóvel:', err);
    
    // Verificar se o backend está disponível
    if (useEmptyData) {
      throw new Error('Não foi possível cadastrar o imóvel - Backend não disponível');
    }
    
    // Verificar se é um erro de matrícula duplicada
    if (err.message && err.message.includes('Matrícula já cadastrada')) {
      throw new Error(`A matrícula ${imovel.matricula} já está cadastrada no sistema. Por favor, utilize outra matrícula.`);
    }
    
    throw err;
  }
}

// Função auxiliar para mapear os dados da API para o formato esperado pelo frontend
function mapearImovelDaAPI(imovelAPI: any): Imovel {
  console.log('mapearImovelDaAPI: Mapeando imóvel da API:', imovelAPI);
  
  // Verificar e logar os dados de infraestrutura
  console.log('mapearImovelDaAPI: Dados de infraestrutura recebidos:', imovelAPI.Infraestrutura);
  
  // Converter o ID para string se for necessário
  const id = imovelAPI.Id?.toString() || imovelAPI.id?.toString() || '';
  
  // Preparar os dados de infraestrutura
  let infraestrutura;
  
  console.log('Valores originais de infraestrutura:', imovelAPI.infraestrutura);
  
  if (imovelAPI.infraestrutura) {
    // Se a infraestrutura vier como um objeto aninhado com propriedades em lowercase (novo formato)
    console.log('mapearImovelDaAPI: Usando dados de infraestrutura do objeto aninhado (lowercase)');
    infraestrutura = {
      agua: Boolean(imovelAPI.infraestrutura.agua),
      esgoto: Boolean(imovelAPI.infraestrutura.esgoto),
      energia: Boolean(imovelAPI.infraestrutura.energia),
      pavimentacao: Boolean(imovelAPI.infraestrutura.pavimentacao),
      iluminacao: Boolean(imovelAPI.infraestrutura.iluminacao),
      coletaLixo: Boolean(imovelAPI.infraestrutura.coletaLixo)
    };
  } else if (imovelAPI.Infraestrutura) {
    // Se a infraestrutura vier como um objeto aninhado com propriedades em uppercase (formato antigo)
    console.log('mapearImovelDaAPI: Usando dados de infraestrutura do objeto aninhado (uppercase)');
    infraestrutura = {
      agua: Boolean(imovelAPI.Infraestrutura.Agua),
      esgoto: Boolean(imovelAPI.Infraestrutura.Esgoto),
      energia: Boolean(imovelAPI.Infraestrutura.Energia),
      pavimentacao: Boolean(imovelAPI.Infraestrutura.Pavimentacao),
      iluminacao: Boolean(imovelAPI.Infraestrutura.Iluminacao),
      coletaLixo: Boolean(imovelAPI.Infraestrutura.ColetaLixo)
    };
  } else {
    // Se a infraestrutura vier como propriedades individuais
    console.log('mapearImovelDaAPI: Usando dados de infraestrutura de propriedades individuais');
    infraestrutura = {
      agua: Boolean(imovelAPI.Agua || imovelAPI.agua || false),
      esgoto: Boolean(imovelAPI.Esgoto || imovelAPI.esgoto || false),
      energia: Boolean(imovelAPI.Energia || imovelAPI.energia || false),
      pavimentacao: Boolean(imovelAPI.Pavimentacao || imovelAPI.pavimentacao || false),
      iluminacao: Boolean(imovelAPI.Iluminacao || imovelAPI.iluminacao || false),
      coletaLixo: Boolean(imovelAPI.ColetaLixo || imovelAPI.coletaLixo || false)
    };
  }
  
  console.log('mapearImovelDaAPI: Infraestrutura convertida para booleanos:', infraestrutura);
  
  // Log para debug - verificar a área recebida da API
  console.log('mapearImovelDaAPI: Valores de área recebidos:', {
    Area: imovelAPI.Area,
    AreaM2: imovelAPI.AreaM2,
    area: imovelAPI.area
  });
  
  // Extrair e converter a área corretamente
  let areaValue = 0;
  if (imovelAPI.Area !== undefined && imovelAPI.Area !== null) {
    areaValue = parseFloat(String(imovelAPI.Area)) || 0;
  } else if (imovelAPI.AreaM2 !== undefined && imovelAPI.AreaM2 !== null) {
    areaValue = parseFloat(String(imovelAPI.AreaM2)) || 0;
  } else if (imovelAPI.area !== undefined && imovelAPI.area !== null) {
    areaValue = parseFloat(String(imovelAPI.area)) || 0;
  }
  
  console.log('mapearImovelDaAPI: Área convertida:', areaValue);
  
  return {
    id: id,
    matricula: imovelAPI.Matricula || imovelAPI.matricula || '',
    localizacao: imovelAPI.Localizacao || imovelAPI.localizacao || '',
    area: areaValue,
    objeto: imovelAPI.Objeto || imovelAPI.objeto || '',
    tipoImovel: imovelAPI.TipoImovel || imovelAPI.tipoImovel || 'Outros',
    finalidade: imovelAPI.Finalidade || imovelAPI.finalidade || 'Outros',
    statusTransferencia: imovelAPI.StatusTransferencia || imovelAPI.statusTransferencia || 'Não transferido',
    imovelPaiId: imovelAPI.ImovelPaiId || imovelAPI.imovelPaiId || null,
    dataCadastro: imovelAPI.DataCadastro || imovelAPI.dataCadastro || '',
    dataAtualizacao: imovelAPI.DataAtualizacao || imovelAPI.dataAtualizacao || '',
    valorVenal: imovelAPI.ValorVenal || imovelAPI.valorVenal || 0,
    registroIPTU: imovelAPI.RegistroIPTU || imovelAPI.registroIPTU || '',
    latitude: imovelAPI.Latitude || imovelAPI.latitude || 0,
    longitude: imovelAPI.Longitude || imovelAPI.longitude || 0,
    pontoReferencia: imovelAPI.PontoReferencia || imovelAPI.pontoReferencia || '',
    tipoPosse: imovelAPI.TipoPosse || imovelAPI.tipoPosse || 'Outros',
    tipoUsoEdificacao: imovelAPI.TipoUsoEdificacao || imovelAPI.tipoUsoEdificacao || 'Outros',
    observacao: imovelAPI.Observacao || imovelAPI.observacao || '',
    matriculasOriginadas: imovelAPI.MatriculasOriginadas || imovelAPI.matriculasOriginadas || '',
    documentos: [],
    areaDesmembrada: parseFloat(String(imovelAPI.AreaDesmembrada || 0)) || 0,
    areaRemanescente: parseFloat(String(imovelAPI.AreaRemanescente || 0)) || 0,
    percentualDesmembrado: parseFloat(String(imovelAPI.PercentualDesmembrado || 0)) || 0,
    infraestrutura: infraestrutura,
    usuarioCadastroId: imovelAPI.UsuarioCadastroId || imovelAPI.usuarioCadastroId || '',
    // Tratamento especial para o campo de nome do usuário, verificando várias possíveis estruturas de resposta
    usuarioCadastroNome: (
      imovelAPI.UsuarioCadastroNome || 
      imovelAPI.usuarioCadastroNome || 
      (imovelAPI.Usuario?.Nome) || 
      (imovelAPI.usuario?.nome) ||
      'Não informado'
    )
  };
}

// Serviço para buscar imóveis com filtros
export async function buscarImoveis(filtros?: {
  matricula?: string;
  localizacao?: string;
  tipoImovel?: string;
  statusTransferencia?: string;
  apenasPrincipais?: boolean;
}): Promise<Imovel[]> {
  console.log('buscarImoveis: Iniciando busca com filtros:', filtros);
  
  // Forçar nova verificação de disponibilidade do backend
  try {
    const backendAvailable = await isBackendAvailable();
    console.log('buscarImoveis: Backend disponível?', backendAvailable);
    
    // Se o backend não está disponível, usamos dados vazios
    if (!backendAvailable) {
      console.log('buscarImoveis: Backend não disponível, retornando dados vazios');
      return dadosVazios;
    }
  } catch (err) {
    console.error('buscarImoveis: Erro ao verificar disponibilidade do backend:', err);
    // Em caso de erro, retornamos dados vazios
    return dadosVazios;
  }
    
  // Buscar imóveis da API
  try {
    // Construir query string para filtros
    let queryParams = new URLSearchParams();
    if (filtros) {
      if (filtros.matricula) queryParams.append('matricula', filtros.matricula);
      if (filtros.localizacao) queryParams.append('localizacao', filtros.localizacao);
      if (filtros.tipoImovel) queryParams.append('tipoImovel', filtros.tipoImovel);
      if (filtros.statusTransferencia) queryParams.append('statusTransferencia', filtros.statusTransferencia);
      if (filtros.apenasPrincipais) queryParams.append('apenasPrincipais', filtros.apenasPrincipais.toString());
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    console.log('buscarImoveis: Buscando imóveis na API com query:', `/imoveis${queryString}`);
    
    const imoveisAPI = await fetchApi(`/imoveis${queryString}`);
    console.log('buscarImoveis: Imóveis recebidos da API (brutos):', imoveisAPI);
    
    // Mapear os dados da API para o formato esperado pelo frontend
    const imoveis = Array.isArray(imoveisAPI) 
      ? imoveisAPI.map(imovelAPI => mapearImovelDaAPI(imovelAPI))
      : [];
    
    console.log('buscarImoveis: Imóveis mapeados:', imoveis.length);
    if (imoveis.length > 0) {
      console.log('buscarImoveis: Exemplo de imóvel mapeado:', imoveis[0]);
    }
    
    return imoveis;
  } catch (err) {
    console.error('buscarImoveis: Erro ao buscar imóveis:', err);
    
    // Tentar usar dados mockados como fallback
    console.log('buscarImoveis: Tentando usar dados mockados como fallback');
    useMockData = true;
    return mockImoveis;
  }
}

// Serviço para obter imóveis secundários
export async function buscarImoveisSecundarios(imovelPaiId: number | string): Promise<Imovel[]> {
  console.log('buscarImoveisSecundarios: Buscando imóveis secundários para o imóvel pai:', imovelPaiId);
  
  // Verificar se devemos usar dados vazios
  if (useEmptyData) {
    console.log('buscarImoveisSecundarios: Backend não disponível, retornando dados vazios');
    return dadosVazios;
  }
  
  try {
    // Usar a nova rota completa para obter os imóveis secundários
    const imoveisAPI = await fetchApi(`/imoveis/${imovelPaiId}/secundarios/completo`);
    console.log('buscarImoveisSecundarios: Dados brutos da API:', imoveisAPI);
    
    // Mapear os dados da API para o formato esperado pelo frontend
    const imoveis = Array.isArray(imoveisAPI) 
      ? imoveisAPI.map(imovelAPI => mapearImovelDaAPI(imovelAPI))
      : [];
    
    console.log('buscarImoveisSecundarios: Imóveis secundários mapeados:', imoveis.length);
    if (imoveis.length > 0) {
      console.log('buscarImoveisSecundarios: Exemplo de imóvel secundário:', imoveis[0]);
    }
    
    return imoveis;
  } catch (err) {
    console.error('buscarImoveisSecundarios: Erro ao buscar imóveis secundários:', err);
    
    // Marcar que o backend não está disponível
    console.log('buscarImoveisSecundarios: Erro ao acessar o backend, retornando dados vazios');
    useEmptyData = true;
    return dadosVazios;
  }
}

// Interface para representar informações de imóveis secundários
export interface ImovelSecundarioInfo {
  Id: string;
  Matricula: string;
  Objeto: string;
}

// Interface para erro de exclusão com imóveis secundários
export interface ErroExclusaoComSecundarios extends Error {
  secundarios?: ImovelSecundarioInfo[];
}

// Serviço para excluir um imóvel
export async function excluirImovel(id: string, excluirSecundarios: boolean = false): Promise<boolean> {
  console.log('excluirImovel: Excluindo imóvel com ID:', id, excluirSecundarios ? 'com secundários' : 'sem secundários');
  
  try {
    // Verificar se o backend está disponível
    const backendAvailable = await isBackendAvailable();
    if (!backendAvailable) {
      console.log('excluirImovel: Backend não disponível');
      throw new Error('Não foi possível excluir o imóvel - Backend não disponível');
    }
    
    // Se não estamos excluindo em cascata, verificar se o imóvel tem secundários
    if (!excluirSecundarios) {
      console.log('excluirImovel: Verificando se o imóvel tem secundários');
      try {
        const secundariosResponse = await fetchApi(`/imoveis/${id}/secundarios`);
        
        if (secundariosResponse.temSecundarios) {
          console.log(`excluirImovel: Imóvel tem ${secundariosResponse.count} secundários`);
          
          // Criar um erro personalizado com informações sobre os imóveis secundários
          const erroPersonalizado = new Error(`Este imóvel possui ${secundariosResponse.count} imóveis secundários. Você precisa excluir os imóveis secundários primeiro ou solicitar a exclusão em cascata.`) as ErroExclusaoComSecundarios;
          erroPersonalizado.secundarios = secundariosResponse.secundarios;
          throw erroPersonalizado;
        }
      } catch (err) {
        if (err instanceof Error && 'secundarios' in err) {
          // Se o erro já é um ErroExclusaoComSecundarios, apenas propagar
          throw err;
        }
        // Outros erros na verificação de secundários são ignorados e tentamos excluir mesmo assim
        console.warn('excluirImovel: Erro ao verificar secundários, tentando excluir mesmo assim:', err);
      }
    }
    
    // Excluir o imóvel (com ou sem cascata)
    await fetchApi(`/imoveis/${id}${excluirSecundarios ? '?cascade=true' : ''}`, {
      method: 'DELETE'
    });
    
    console.log('excluirImovel: Imóvel excluído com sucesso');
    return true;
  } catch (err) {
    console.error('excluirImovel: Erro ao excluir imóvel:', err);
    
    // Tentar extrair a resposta JSON do erro
    try {
      if (err instanceof Error && err.message.includes('Erro na API: 400')) {
        // Tentar obter o corpo da resposta
        const responseText = await fetch(`${API_URL}/imoveis/${id}`).then(r => r.json());
        console.log('excluirImovel: Resposta completa do erro:', responseText);
        
        // Verificar se a resposta contém informações sobre imóveis secundários
        if (responseText && responseText.secundarios) {
          console.log('excluirImovel: Imóvel possui secundários:', responseText.secundarios);
          
          // Criar um erro personalizado com informações sobre os imóveis secundários
          const erroPersonalizado = new Error(responseText.message || 'Este imóvel possui imóveis secundários') as ErroExclusaoComSecundarios;
          erroPersonalizado.secundarios = responseText.secundarios;
          throw erroPersonalizado;
        }
      }
    } catch (parseErr) {
      console.error('excluirImovel: Erro ao processar resposta de erro:', parseErr);
    }
    
    // Marcar que o backend não está disponível
    useEmptyData = true;
    throw new Error(`Erro ao excluir o imóvel: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
  }
}

// Serviço para listar imóveis secundários de um imóvel principal
export async function listarImoveisSecundarios(imovelPaiId: string): Promise<Imovel[]> {
  console.log('listarImoveisSecundarios: Buscando imóveis secundários do imóvel principal:', imovelPaiId);
  
  // Verificar se o backend está disponível
  if (useEmptyData) {
    console.log('listarImoveisSecundarios: Backend não disponível');
    return [];
  }
  
  try {
    const response = await fetchApi(`/imoveis/${imovelPaiId}/secundarios/completo`);
    console.log('listarImoveisSecundarios: Dados brutos da API:', response);
    
    // Mapear os dados da API para o formato esperado pelo frontend
    const imoveisSecundarios = Array.isArray(response) 
      ? response.map(imovelAPI => mapearImovelDaAPI(imovelAPI))
      : [];
    
    console.log('listarImoveisSecundarios: Imóveis secundários mapeados:', imoveisSecundarios.length);
    return imoveisSecundarios;
  } catch (err) {
    console.error('listarImoveisSecundarios: Erro ao listar imóveis secundários:', err);
    
    // Marcar que o backend não está disponível
    useEmptyData = true;
    return [];
  }
}

// Serviço para atualizar um imóvel existente
export async function atualizarImovel(id: string, imovel: ImovelFormData): Promise<boolean> {
  console.log('atualizarImovel: Atualizando imóvel com ID:', id, 'Dados:', imovel);
  
  // Verificar se o backend está disponível
  const backendAvailable = await isBackendAvailable();
  
  if (!backendAvailable) {
    console.log('atualizarImovel: Backend não disponível');
    throw new Error('Não foi possível atualizar o imóvel - Backend não disponível');
  }
  
  try {
    // Tratar as matrículas originadas se existirem
    if (typeof imovel.matriculasOriginadas === 'string') {
      imovel.matriculasOriginadas = imovel.matriculasOriginadas
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);
    }
    
    // Fazer a requisição para atualizar o imóvel
    const response = await fetchApi(`/imoveis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(imovel)
    });
    
    console.log('atualizarImovel: Resposta da API:', response);
    return true;
  } catch (err: any) {
    console.error('atualizarImovel: Erro ao atualizar imóvel:', err);
    
    // Verificar se é um erro de matrícula duplicada
    if (err.message && err.message.includes('Matrícula já cadastrada')) {
      throw new Error(`A matrícula ${imovel.matricula} já está cadastrada em outro imóvel. Por favor, utilize outra matrícula.`);
    }
    
    throw err;
  }
}
