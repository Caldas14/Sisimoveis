// Dados vazios para fallback
const dadosVazios = [];

// Função para testar a conexão com o backend
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/test-connection');
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return false;
  }
}

// Funções para operações com imóveis
export async function getImoveis() {
  try {
    const response = await fetch('/api/imoveis');
    if (!response.ok) {
      throw new Error('Falha ao buscar imóveis');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    return dadosVazios;
  }
}

export async function getImovelById(id: string) {
  try {
    const response = await fetch(`/api/imoveis/${id}`);
    if (!response.ok) {
      throw new Error(`Imóvel com ID ${id} não encontrado`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar imóvel com ID ${id}:`, error);
    throw new Error(`Imóvel com ID ${id} não encontrado`);
  }
}

export async function createImovel(imovel: any) {
  try {
    const response = await fetch('/api/imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imovel),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar imóvel');
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Erro ao criar imóvel:', error);
    throw new Error('Falha ao criar imóvel');
  }
}

export async function updateImovel(id: string, imovel: any) {
  try {
    const response = await fetch(`/api/imoveis/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imovel),
    });

    if (!response.ok) {
      throw new Error(`Falha ao atualizar imóvel com ID ${id}`);
    }

    return true;
  } catch (error) {
    console.error(`Erro ao atualizar imóvel com ID ${id}:`, error);
    throw new Error(`Falha ao atualizar imóvel com ID ${id}`);
  }
}

export async function deleteImovel(id: string) {
  try {
    const response = await fetch(`/api/imoveis/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Falha ao excluir imóvel com ID ${id}`);
    }

    return true;
  } catch (error) {
    console.error(`Erro ao excluir imóvel com ID ${id}:`, error);
    throw new Error(`Falha ao excluir imóvel com ID ${id}`);
  }
}