import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rota para listar diretórios e arquivos
router.get('/listar', async (req, res) => {
  try {
    const { diretorio } = req.query;
    const dir = diretorio || 'C:\\'; // Diretório padrão se não for especificado
    
    if (!fs.existsSync(dir)) {
      return res.status(404).json({ error: 'Diretório não encontrado' });
    }
    
    const itens = fs.readdirSync(dir, { withFileTypes: true });
    const resultado = itens.map(item => ({
      nome: item.name,
      caminho: path.join(dir, item.name),
      tipo: item.isDirectory() ? 'diretorio' : 'arquivo',
      extensao: item.isDirectory() ? null : path.extname(item.name).substring(1)
    }));
    
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao listar arquivos:', err);
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
});

// Rota para obter informações de um arquivo
router.get('/info', async (req, res) => {
  try {
    const { caminho } = req.query;
    
    if (!caminho) {
      return res.status(400).json({ error: 'Caminho do arquivo não especificado' });
    }
    
    if (!fs.existsSync(caminho)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const stats = fs.statSync(caminho);
    const fileName = path.basename(caminho);
    
    res.json({
      nome: fileName,
      caminho: caminho,
      tamanho: stats.size,
      criado: stats.birthtime,
      modificado: stats.mtime,
      extensao: path.extname(fileName).substring(1)
    });
  } catch (err) {
    console.error('Erro ao obter informações do arquivo:', err);
    res.status(500).json({ error: 'Erro ao obter informações do arquivo' });
  }
});

export default router;
