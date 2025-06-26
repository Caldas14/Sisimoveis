// Serviço para gerenciar os valores personalizados

// Tipos para os valores personalizados
export interface ValorPersonalizado {
  // Propriedades com iniciais minúsculas (formato esperado pelo frontend)
  id?: string;
  categoria?: string;
  valor?: string;
  dataCriacao?: string;
  usuarioCriacao?: string;
  
  // Propriedades com iniciais maiúsculas (formato retornado pelo servidor)
  Id?: string;
  Categoria?: string;
  Valor?: string;
  DataCriacao?: string;
  UsuarioCriacao?: string;
}

// Tipo para representar uma opção de select
export interface OpcaoSelect {
  value: string;
  label: string;
  personalizado?: boolean; // Indica se o valor é personalizado ou padrão
}

// Função para buscar valores personalizados por categoria
export async function buscarValoresPersonalizados(categoria: string): Promise<ValorPersonalizado[]> {
  try {
    console.log(`Buscando valores personalizados para categoria: ${categoria}`);
    const response = await fetch(`http://localhost:3001/api/valores-personalizados/${categoria}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar valores personalizados: ${response.statusText}`);
    }
    
    const dados = await response.json();
    console.log(`Valores personalizados recebidos para ${categoria}:`, dados);
    return dados;
  } catch (error) {
    console.error(`Erro ao buscar valores personalizados para ${categoria}:`, error);
    throw error;
  }
}

// Função para adicionar um novo valor personalizado
export async function adicionarValorPersonalizado(
  categoria: string, 
  valor: string,
  usuarioCriacao?: string
): Promise<ValorPersonalizado> {
  try {
    console.log(`Adicionando valor personalizado: ${valor} para categoria ${categoria}`);
    const response = await fetch('http://localhost:3001/api/valores-personalizados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        categoria,
        valor,
        usuarioCriacao: usuarioCriacao || 'Sistema'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ao adicionar valor personalizado: ${response.statusText}`);
    }
    
    const dados = await response.json();
    return dados;
  } catch (error) {
    console.error(`Erro ao adicionar valor personalizado para ${categoria}:`, error);
    throw error;
  }
}

// Função para excluir um valor personalizado
export async function excluirValorPersonalizado(id: string): Promise<void> {
  try {
    console.log(`Excluindo valor personalizado com ID: ${id}`);
    const response = await fetch(`http://localhost:3001/api/valores-personalizados/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao excluir valor personalizado: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Erro ao excluir valor personalizado:`, error);
    throw error;
  }
}

// Função para combinar valores padrão com valores personalizados
export function combinarValores(
  valoresPadrao: OpcaoSelect[],
  valoresPersonalizados: ValorPersonalizado[]
): OpcaoSelect[] {
  console.log('Valores personalizados recebidos para combinar:', valoresPersonalizados);
  
  // Converter valores personalizados para o formato de opção
  // Considerando que o servidor retorna propriedades com iniciais maiúsculas (Valor, Id)
  const opcoesPersonalizadas = valoresPersonalizados
    .filter(vp => (vp.Valor || vp.valor)) // Filtrar itens sem valor
    .map(vp => {
      // Verificar se está usando Valor (maiúsculo) ou valor (minúsculo)
      const valorTexto = vp.Valor || vp.valor || '';
      
      // Criar opção com valor personalizado
      return {
        value: valorTexto,
        label: valorTexto,
        personalizado: true
      } as OpcaoSelect;
    });
  
  console.log('Opções personalizadas convertidas:', opcoesPersonalizadas);
  
  // Combinar os valores (evitando duplicatas)
  const valoresCombinados = [...valoresPadrao];
  
  // Adicionar apenas valores personalizados que não existem nos valores padrão
  for (const opcaoPersonalizada of opcoesPersonalizadas) {
    if (!valoresPadrao.some(vp => vp.value === opcaoPersonalizada.value)) {
      valoresCombinados.push(opcaoPersonalizada);
    }
  }
  
  // Adicionar propriedade personalizado=false para valores padrão que não têm essa propriedade definida
  const valoresFinais = valoresCombinados.map(opcao => {
    if (opcao.personalizado === undefined) {
      return { ...opcao, personalizado: false };
    }
    return opcao;
  });
  
  // Ordenar por label (garantindo que não há valores undefined)
  return valoresFinais
    .filter(item => item && item.label) // Remover itens sem label
    .sort((a, b) => {
      const labelA = a.label || '';
      const labelB = b.label || '';
      return labelA.localeCompare(labelB);
    });
}
