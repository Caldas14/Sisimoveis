/**
 * Serviço para comunicação com a API
 */

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Interface para opções da requisição
interface FetchOptions extends RequestInit {
  body?: string;
  headers?: Record<string, string>;
}

/**
 * Função para fazer requisições à API
 * @param endpoint - Endpoint da API (sem a URL base)
 * @param options - Opções da requisição
 * @returns Resposta da API em formato JSON
 */
export async function fetchApi(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Configurar headers padrão
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  console.log('fetchApi: Chamando', url);
  console.log(`
            
            `);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    console.log('fetchApi: Resposta para', endpoint, ':', response.status, response.statusText);
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    // Retornar dados em formato JSON
    return await response.json();
  } catch (error) {
    console.error('Erro ao chamar API', endpoint, ':', error);
    throw error;
  }
}
