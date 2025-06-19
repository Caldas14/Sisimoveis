import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatarData = (data: string | Date) => {
  return new Date(data).toLocaleDateString('pt-BR');
};

export const formatarArea = (area: number | undefined | null) => {
  if (area === undefined || area === null) return '0 m²';
  const areaNum = typeof area === 'number' ? area : parseFloat(String(area));
  if (isNaN(areaNum)) return '0 m²';
  return `${areaNum.toLocaleString('pt-BR')} m²`;
};

export const downloadCSV = (data: any[], filename: string) => {
  // Obter cabeçalhos do CSV a partir das chaves do primeiro item
  const headers = Object.keys(data[0]);
  
  // Criar linha de cabeçalho
  const csvRows = [
    headers.join(','),
    // Mapear cada objeto para uma linha CSV
    ...data.map(row => {
      return headers.map(header => {
        // Converter valor para string e escapar vírgulas
        const cell = row[header] === null || row[header] === undefined ? '' : row[header].toString();
        return cell.includes(',') ? `"${cell}"` : cell;
      }).join(',');
    })
  ];
  
  // Juntar todas as linhas com quebras de linha
  const csvString = csvRows.join('\n');
  
  // Criar um blob e download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função avançada para download de CSV formatado com suporte a Excel
export const downloadFormatadoCSV = (dados: any[], filename: string, config?: {
  secoes?: Array<{ titulo: string, campos: string[] }>,
  corTitulos?: string,
  corCabecalhos?: string,
  estiloDados?: string,
  tituloRelatorio?: string
}) => {
  // Configurações padrão
  const configuracao = {
    corTitulos: '#3366FF',      // Azul para títulos de seção
    corCabecalhos: '#4B9D64',  // Verde para cabeçalhos
    estiloDados: 'normal',     // Estilo normal para dados
    tituloRelatorio: 'Relatório de Imóvel',  // Título padrão
    ...config
  };

  // Data atual formatada
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR');
  
  // Converter dados para formato tabular compatível com Excel
  let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <meta name="ProgId" content="Excel.Sheet">
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        table {
          width: 100%;
          border: 1px solid #CCCCCC;
          border-collapse: collapse;
        }
        td, th {
          border: 1px solid #CCCCCC;
          padding: 8px;
          vertical-align: middle;
        }
        .header {
          background: linear-gradient(to right, ${configuracao.corTitulos}, #1a56db);
          text-align: center;
          color: white;
          padding: 15px 5px;
          border-bottom: 3px solid #003366;
          margin-bottom: 20px;
          width: 100%;
        }
        .header-logo {
          font-size: 28pt;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .header-title {
          font-size: 22pt;
          font-weight: normal;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        .header-info {
          font-size: 10pt;
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.9);
        }
        .secao-titulo {
          background-color: ${configuracao.corTitulos};
          color: white;
          font-weight: bold;
          font-size: 14pt;
          text-align: center;
          padding: 10px;
        }
        .cabecalho {
          background-color: ${configuracao.corCabecalhos};
          color: white;
          font-weight: bold;
          text-align: center;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .valor-sim {
          color: green;
          font-weight: bold;
        }
        .valor-nao {
          color: #999999;
        }
        .footer {
          font-size: 8pt;
          text-align: center;
          color: #666666;
          margin-top: 10px;
          border-top: 1px solid #CCCCCC;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <!-- Cabeçalho do relatório -->
      <div class="header">
        <div class="header-logo">SisImóveis</div>
        <div class="header-title">${configuracao.tituloRelatorio}</div>
        <div class="header-info">Gerado em: ${dataAtual} às ${horaAtual}</div>
      </div>
      
      <!-- Tabela de dados -->
      <table width="100%">
  `;

  // Se as seções foram definidas, organizamos os dados conforme as seções
  if (configuracao.secoes && configuracao.secoes.length > 0) {
    // Para cada seção definida
    configuracao.secoes.forEach(secao => {
      // Adicionar título da seção
      htmlContent += `
        <tr>
          <td colspan="2" class="secao-titulo">${secao.titulo}</td>
        </tr>
      `;
      
      // Adicionar campos da seção
      secao.campos.forEach(campo => {
        // Encontrar o valor correspondente nos dados
        const dado = dados[0][campo] || ''; // Assumindo que dados[0] contém o imóvel principal
        
        let valorFormatado = dado;
        
        // Formatar valores específicos
        if (typeof dado === 'boolean' || dado === 'Sim' || dado === 'Não') {
          const valorBooleano = dado === true || dado === 'Sim';
          valorFormatado = `<span class="valor-${valorBooleano ? 'sim' : 'nao'}">${valorBooleano ? 'Sim' : 'Não'}</span>`;
        }
        
        htmlContent += `
          <tr>
            <td class="cabecalho">${campo}</td>
            <td>${valorFormatado}</td>
          </tr>
        `;
      });
    });
  } else {
    // Modo padrão: todas as propriedades
    const headers = Object.keys(dados[0]);
    
    // Adicionar cabeçalhos
    htmlContent += '<tr>';
    headers.forEach(header => {
      htmlContent += `<th class="cabecalho">${header}</th>`;
    });
    htmlContent += '</tr>';
    
    // Adicionar dados
    dados.forEach(row => {
      htmlContent += '<tr>';
      headers.forEach(header => {
        const valor = row[header] || '';
        let valorFormatado = valor;
        
        // Formatar valores específicos
        if (typeof valor === 'boolean' || valor === 'Sim' || valor === 'Não') {
          const valorBooleano = valor === true || valor === 'Sim';
          valorFormatado = `<span class="valor-${valorBooleano ? 'sim' : 'nao'}">${valorBooleano ? 'Sim' : 'Não'}</span>`;
        }
        
        htmlContent += `<td>${valorFormatado}</td>`;
      });
      htmlContent += '</tr>';
    });
  }
  
  // Fechar tabela e adicionar rodapé
  htmlContent += `
      </table>
      
      <!-- Rodapé com informações -->
      <div class="footer">
        <p>SisImóveis - Sistema de Gestão de Imóveis - Relatório gerado automaticamente</p>
      </div>
    </body>
    </html>
  `;
  
  // Adicionar BOM para garantir que o arquivo seja aberto corretamente no Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Criar link para download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};