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