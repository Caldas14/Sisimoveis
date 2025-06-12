import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar configuração de diretórios de documentos
let diretoriosDocumentos = [];
try {
  const configPath = path.join(__dirname, '..', 'documentos-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    diretoriosDocumentos = config.diretoriosDocumentos || [];
  }
} catch (err) {
  console.error('Erro ao carregar configuração de diretórios de documentos:', err);
  // Definir diretórios padrão
  diretoriosDocumentos = [
    path.join(process.cwd(), 'documentos'),
    path.join(os.homedir(), 'Downloads'),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS'),
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'OneDrive', 'Desktop'),
    path.join(os.homedir(), 'OneDrive', 'Área de Trabalho')
  ];
}

// Rota para abrir um arquivo
router.post('/abrir', (req, res) => {
  const { caminhoArquivo } = req.body;
  
  if (!caminhoArquivo) {
    return res.status(400).json({ error: 'Caminho do arquivo não fornecido' });
  }
  
  console.log('Solicitação para abrir arquivo:', caminhoArquivo);
  
  // Verificar se o caminho é absoluto
  let caminhoCompleto = caminhoArquivo;
  
  // Se não for um caminho absoluto, tentar encontrar o arquivo
  if (!path.isAbsolute(caminhoCompleto)) {
    console.log('Caminho não é absoluto, tentando encontrar o arquivo...');
    
    // Tentar encontrar o arquivo em diretórios comuns
    let arquivoEncontrado = false;
    
    for (const dir of diretoriosDocumentos) {
      const caminhoTentativa = path.join(dir, caminhoArquivo);
      console.log('Tentando caminho:', caminhoTentativa);
      
      if (fs.existsSync(caminhoTentativa)) {
        caminhoCompleto = caminhoTentativa;
        arquivoEncontrado = true;
        console.log('Arquivo encontrado em:', caminhoCompleto);
        break;
      }
    }
    
    if (!arquivoEncontrado) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  }
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(caminhoCompleto)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  // Comando para abrir o arquivo com o aplicativo padrão
  let comando;
  
  if (process.platform === 'win32') {
    // Windows
    comando = `start "" "${caminhoCompleto}"`;
  } else if (process.platform === 'darwin') {
    // macOS
    comando = `open "${caminhoCompleto}"`;
  } else {
    // Linux
    comando = `xdg-open "${caminhoCompleto}"`;
  }
  
  console.log('Executando comando:', comando);
  
  // Executar o comando
  exec(comando, (error, stdout, stderr) => {
    if (error) {
      console.error('Erro ao abrir arquivo:', error);
      return res.status(500).json({ error: 'Erro ao abrir arquivo: ' + error.message });
    }
    
    console.log('Arquivo aberto com sucesso');
    res.json({ success: true, message: 'Arquivo aberto com sucesso' });
  });
});

export default router;
