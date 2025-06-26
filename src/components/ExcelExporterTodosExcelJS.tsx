import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Imovel } from '../types/imovel';
import { saveAs } from 'file-saver';
import { toast } from './Toast';
import ExcelJS from 'exceljs';

interface ExcelExporterTodosProps {
  imoveis: Imovel[];
  buttonText?: string;
}

const ExcelExporterTodosExcelJS: React.FC<ExcelExporterTodosProps> = ({ 
  imoveis, 
  buttonText = 'Exportar Todos para Excel' 
}) => {
  const { darkMode } = useTheme();

  const gerarExcelImediato = async () => {
    if (!imoveis || imoveis.length === 0) return;
    
    try {
      // Importar o serviço de imóveis
      const { buscarImoveisSecundarios, obterImovelPorId } = await import('../services/imovelService');
      
      // Filtrar apenas imóveis principais
      const imoveisPrincipaisIDs = imoveis
        .filter(imovel => imovel.imovelPaiId === null)
        .map(imovel => imovel.id);
      
      // Buscar dados completos dos imóveis principais (para garantir que temos matriculasOriginadas)
      console.log(`Carregando dados completos para ${imoveisPrincipaisIDs.length} imóveis principais`);
      const imoveisPrincipais = [];
      
      for (const imovelID of imoveisPrincipaisIDs) {
        try {
          const imovelCompleto = await obterImovelPorId(imovelID);
          console.log(`Imóvel principal #${imovelID} carregado com sucesso:`, {
            matricula: imovelCompleto.matricula,
            matriculasOriginadas: imovelCompleto.matriculasOriginadas
          });
          imoveisPrincipais.push(imovelCompleto);
        } catch (err) {
          console.error(`Erro ao carregar dados completos do imóvel principal #${imovelID}:`, err);
        }
      }
      
      // Criar um novo workbook com ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Imóveis';
      workbook.created = new Date();
      
      // Para cada imóvel principal, criar uma planilha
      for (const imovelPrincipal of imoveisPrincipais) {
        try {
          // Buscar imóveis secundários
          const secundarios = await buscarImoveisSecundarios(imovelPrincipal.id);
          
          // Adicionar logs para debug
          console.log(`Processando imóvel principal: ${imovelPrincipal.matricula}`);
          console.log(`Matrículas originadas do principal: ${imovelPrincipal.matriculasOriginadas || 'N/A'}`);
          console.log('Dados completos do imóvel principal:', imovelPrincipal);
          
          if (secundarios && secundarios.length > 0) {
            console.log(`${secundarios.length} imóveis secundários encontrados`);
            secundarios.forEach((sec, i) => {
              console.log(`Secundário #${i+1} - Matrícula: ${sec.matricula}, Matrículas originadas: ${sec.matriculasOriginadas || 'N/A'}`);
              // Log detalhado para ver todos os campos do imóvel secundário
              console.log(`Dados completos do imóvel secundário #${i+1}:`, sec);
            });
          }
          
          // Criar planilha para este imóvel principal
          await criarPlanilhaImovel(workbook, imovelPrincipal, secundarios || []);
          
        } catch (err) {
          console.error(`Erro ao processar imóvel principal ${imovelPrincipal.id}:`, err);
        }
      }
      
      // Exportar o arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `imoveis_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      toast.error("Ocorreu um erro ao gerar o arquivo Excel. Por favor, tente novamente.");
    }
  };

  // Função para criar uma planilha para um imóvel principal e seus secundários
  const criarPlanilhaImovel = async (workbook: ExcelJS.Workbook, imovel: Imovel, imoveisSecundarios: Imovel[]) => {
    // Nome da planilha: usar os primeiros 30 caracteres da matrícula ou objeto para evitar nomes muito longos
    const nomePlanilha = (imovel.matricula || imovel.objeto || 'Imóvel').substring(0, 30);
    
    // Criar nova planilha
    const worksheet = workbook.addWorksheet(nomePlanilha);
    
    // Definir larguras das colunas ajustadas ao conteúdo (sem adicionar cabeçalhos ainda)
    worksheet.columns = [
      { key: 'matricula', width: 18 },
      { key: 'localizacao', width: 40 },
      { key: 'area', width: 15, style: { numFmt: '0.00' } },
      { key: 'objeto', width: 40 },
      { key: 'matriculasOriginadas', width: 25 },
      { key: 'observacao', width: 40 },
      { key: 'finalidade', width: 25 }
    ];
    
    // Adicionar cabeçalho institucional
    const cabecalhoInstitucional = [
      "COMPANHIA ESTADUAL DE HABITAÇÃO OBRAS PÚBLICAS – CEHOP",
      "DIRETORIA DE OPERAÇÕES E SERVIÇOS",
      "GERÊNCIA DE ADMINISTRAÇÃO FUNDIÁRIA – GERAF",
      `Demonstrativo de Desmembramento de Áreas do(a) ${imovel.localizacao || ''}`
    ];
    
    // Inserir linhas de cabeçalho institucional
    for (let i = 0; i < cabecalhoInstitucional.length; i++) {
      // Criar uma linha com 7 células vazias
      const row = worksheet.addRow(['', '', '', '', '', '', '']);
      
      // Mesclar células para o cabeçalho institucional
      worksheet.mergeCells(`A${row.number}:G${row.number}`);
      
      // Definir o valor na primeira célula (após a mesclagem)
      const headerCell = row.getCell(1);
      headerCell.value = cabecalhoInstitucional[i];
      
      // Estilo para o cabeçalho institucional
      headerCell.font = { bold: true, size: 12 };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      // Não definir altura fixa para o cabeçalho institucional
    }
    
    // Adicionar linha em branco após cabeçalho institucional
    worksheet.addRow([]);
    
    // Adicionar linha de cabeçalhos da tabela
    const headerRow = worksheet.addRow(['MATRÍCULA', 'LOCALIZAÇÃO', 'ÁREA/M²', 'OBJETO', 'MAT. ORIGINADAS', 'OBSERVAÇÃO', 'FINALIDADE']);
    
    // Estilo para os cabeçalhos
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Não definir altura fixa para permitir ajuste automático
    
    // Log detalhado dos campos relevantes para o imóvel principal
    console.log(`Detalhes do imóvel principal para planilha - matrícula: ${imovel.matricula}`);
    console.log(`Campo matriculasOriginadas do imóvel principal:`, {
      valor: imovel.matriculasOriginadas,
      tipo: typeof imovel.matriculasOriginadas
    });
    
    // Adicionar linha do imóvel principal
    const principalRow = worksheet.addRow([
      imovel.matricula || '',
      imovel.localizacao || '',
      imovel.area || 0,
      imovel.objeto || '',
      imovel.matriculasOriginadas || '',
      imovel.observacao || '',
      imovel.finalidade || ''
    ]);
    
    // Estilo para o imóvel principal (com negrito)
    principalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle' };
    });
    
    // Ajustar alinhamentos específicos
    principalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // MATRÍCULA
    principalRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // LOCALIZAÇÃO
    principalRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }; // ÁREA
    principalRow.getCell(3).numFmt = '0.00';
    principalRow.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // OBJETO
    principalRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // MAT. ORIGINADAS
    principalRow.getCell(6).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // OBSERVAÇÃO
    principalRow.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' }; // FINALIDADE
    
    // Não definir altura fixa para permitir ajuste automático baseado no conteúdo
    
    // Adicionar os imóveis secundários
    for (const sec of imoveisSecundarios) {
      // Log detalhado do campo matriculasOriginadas para cada imóvel secundário
      console.log(`Detalhes do imóvel secundário - matrícula: ${sec.matricula}`);
      console.log(`Campo matriculasOriginadas do imóvel secundário:`, {
        valor: sec.matriculasOriginadas,
        tipo: typeof sec.matriculasOriginadas
      });
      
      const secundarioRow = worksheet.addRow([
        sec.matricula || '',
        sec.localizacao || '',
        sec.area || 0,
        sec.objeto || '',
        sec.matriculasOriginadas || '',
        sec.observacao || '',
        sec.finalidade || ''
      ]);
      
      // Estilo para imóveis secundários (sem negrito)
      secundarioRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      
      // Ajustar alinhamentos específicos
      secundarioRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // MATRÍCULA
      secundarioRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // LOCALIZAÇÃO
      secundarioRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }; // ÁREA
      secundarioRow.getCell(3).numFmt = '0.00';
      secundarioRow.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // OBJETO
      secundarioRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // MAT. ORIGINADAS
      secundarioRow.getCell(6).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // OBSERVAÇÃO
      secundarioRow.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' }; // FINALIDADE
      
      // Não definir altura fixa para permitir ajuste automático baseado no conteúdo
    }
    
    // Adicionar linhas de resumo se necessário
    if (imoveisSecundarios.length > 0) {
      const areaTotalSecundarios = imoveisSecundarios.reduce((total, im) => total + (im.area || 0), 0);
      const areaRemanescente = Math.max(0, (imovel.area || 0) - areaTotalSecundarios);
      const areaTotal = imovel.area || 0;
      
      // Estilo específico para linhas de totais
      const areaStyle = {
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC0C0C0' } },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { vertical: 'middle' }
      };
      
      // Adicionar linha de ÁREA REMANESCENTE ATUAL
      const remanescRow = worksheet.addRow(['ÁREA REMANESCENTE ATUAL', '', areaRemanescente, '', '', '', '']);
      remanescRow.eachCell({ includeEmpty: true }, (cell) => {
        Object.assign(cell, areaStyle);
      });
      remanescRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      remanescRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      remanescRow.getCell(3).numFmt = '0.00';
      worksheet.mergeCells(`A${remanescRow.number}:B${remanescRow.number}`);
      
      // Adicionar linha de ÁREA TOTAL
      const totalRow = worksheet.addRow(['ÁREA TOTAL', '', areaTotal, '', '', '', '']);
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        Object.assign(cell, areaStyle);
      });
      totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      totalRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      totalRow.getCell(3).numFmt = '0.00';
      worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
    }
  };

  return (
    <button 
      onClick={gerarExcelImediato}
      className={`px-4 py-2.5 border rounded-lg shadow-sm transition-colors duration-200 flex items-center ${
        darkMode 
          ? 'bg-gray-900 text-green-400 border-green-900 hover:bg-gray-800' 
          : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
      }`}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {buttonText}
    </button>
  );
};

export default ExcelExporterTodosExcelJS;
