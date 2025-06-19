import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para ler a configuração de documentos
function lerConfigDocumentos() {
  const configPath = path.join(__dirname, '..', 'documentos-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      console.log(`Configuração de documentos carregada: ${config.diretoriosDocumentos ? config.diretoriosDocumentos.length : 0} diretórios configurados`);
      return config.diretoriosDocumentos || [];
    } else {
      console.warn('Arquivo de configuração de documentos não encontrado:', configPath);
      return [];
    }
  } catch (err) {
    console.error('Erro ao carregar configuração de diretórios de documentos:', err);
    return [];
  }
}

// Rota para abrir um arquivo
router.post('/abrir', (req, res) => {
  const { caminhoArquivo } = req.body;
  
  if (!caminhoArquivo) {
    return res.status(400).json({ error: 'Caminho do arquivo não fornecido' });
  }
  
  console.log('Solicitação para abrir arquivo:', caminhoArquivo);
  
  // Normalizar o caminho (lidar com barras invertidas, etc.)
  let caminhoNormalizado = caminhoArquivo.replace(/\\/g, '\\');
  
  // Lista de caminhos a verificar
  let caminhosPossiveis = [];
  
  // Adicionar o caminho como está (pode ser um caminho absoluto)
  caminhosPossiveis.push(caminhoNormalizado);
  
  // Adicionar possíveis variações do caminho
  if (path.isAbsolute(caminhoNormalizado)) {
    // Se é um caminho absoluto, adicionar sem modificações
    console.log('Caminho é absoluto:', caminhoNormalizado);
  } else {
    console.log('Caminho não é absoluto, tentando encontrar o arquivo...');
    
    // Obter a lista de diretórios configurados do arquivo centralizado
    const diretoriosDocumentos = lerConfigDocumentos();
    console.log(`Buscando em ${diretoriosDocumentos.length} diretórios configurados`);
    
    // Para cada diretório configurado, tentar construir o caminho completo
    for (const dir of diretoriosDocumentos) {
      if (!dir) continue; // Pular diretórios vazios ou undefined
      
      try {
        const caminhoTentativa = path.join(dir, caminhoNormalizado);
        caminhosPossiveis.push(caminhoTentativa);
        console.log('Adicionando caminho possível:', caminhoTentativa);
      } catch (err) {
        console.error('Erro ao construir caminho:', err);
      }
    }
  }
  
  // Tentar encontrar o arquivo em todos os caminhos possíveis
  let caminhoCompleto = null;
  let arquivoEncontrado = false;
  
  for (const caminho of caminhosPossiveis) {
    try {
      console.log('Verificando se existe:', caminho);
      if (fs.existsSync(caminho)) {
        caminhoCompleto = caminho;
        arquivoEncontrado = true;
        console.log('Arquivo encontrado em:', caminhoCompleto);
        break;
      }
    } catch (err) {
      console.error('Erro ao verificar existência do arquivo:', err);
    }
  }
  
  if (!arquivoEncontrado || !caminhoCompleto) {
    return res.status(404).json({ error: 'Arquivo não encontrado em nenhum dos diretórios configurados', caminhosTentados: caminhosPossiveis });
  }
  
  // Comando para abrir o arquivo com o aplicativo padrão
  let comando;
  
  if (process.platform === 'win32') {
    // Windows - usando aspas escapadas corretamente
    comando = `start "" "${caminhoCompleto}"`;
  } else if (process.platform === 'darwin') {
    // macOS
    comando = `open "${caminhoCompleto}"`;
  } else {
    // Linux
    comando = `xdg-open "${caminhoCompleto}"`;
  }
  
  console.log('Executando comando para abrir arquivo:', comando);
  
  // Executar o comando
  exec(comando, (error, stdout, stderr) => {
    if (error) {
      console.error('Erro ao abrir arquivo:', error);
      console.error('Stdout:', stdout);
      console.error('Stderr:', stderr);
      return res.status(500).json({ 
        error: 'Erro ao abrir arquivo', 
        message: error.message,
        caminho: caminhoCompleto,
        comando: comando
      });
    }
    
    console.log('Arquivo aberto com sucesso');
    res.json({ 
      success: true, 
      message: 'Arquivo aberto com sucesso',
      caminho: caminhoCompleto
    });
  });
});

export default router;
