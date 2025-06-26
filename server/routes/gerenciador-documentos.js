import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para ler a configuração de documentos
function lerConfigDocumentos() {
  try {
    const configPath = path.join(__dirname, '..', 'documentos-config.json');
    if (!fs.existsSync(configPath)) {
      console.error('Arquivo de configuração de documentos não encontrado:', configPath);
      return { diretoriosDocumentos: [] };
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (err) {
    console.error('Erro ao ler configuração de documentos:', err);
    return { diretoriosDocumentos: [] };
  }
}

// Função para normalizar caminhos de arquivos
function normalizarCaminho(caminho, isAbsolutePath) {
  if (!caminho) return null;
  
  // Substituir barras invertidas duplas por barras invertidas simples
  let caminhoNormalizado = caminho.replace(/\\\\/g, '\\');
  
  // Se não for um caminho absoluto, tentar resolver para um caminho absoluto
  if (!isAbsolutePath && !path.isAbsolute(caminhoNormalizado)) {
    // Obter a lista de diretórios configurados do arquivo centralizado
    const { diretoriosDocumentos } = lerConfigDocumentos();
    
    // Verificar se o arquivo existe em algum dos diretórios configurados
    for (const diretorio of diretoriosDocumentos) {
      if (!diretorio) continue;
      
      const caminhoCompleto = path.join(diretorio, caminhoNormalizado);
      try {
        if (fs.existsSync(caminhoCompleto)) {
          console.log(`Arquivo encontrado em: ${caminhoCompleto}`);
          return caminhoCompleto;
        }
      } catch (err) {
        console.error(`Erro ao verificar caminho ${caminhoCompleto}:`, err);
      }
    }
  }
  
  return caminhoNormalizado;
}

// Rota para abrir um arquivo no aplicativo padrão do sistema
router.get('/abrir', (req, res) => {
  try {
    const { caminho } = req.query;
    
    if (!caminho) {
      return res.status(400).json({ error: 'Caminho do arquivo não especificado' });
    }
    
    const caminhoNormalizado = normalizarCaminho(caminho, true);
    
    if (!fs.existsSync(caminhoNormalizado)) {
      return res.status(404).json({ 
        error: 'Arquivo não encontrado', 
        caminho: caminhoNormalizado 
      });
    }
    
    // Abrir o arquivo no aplicativo padrão do sistema
    const comando = process.platform === 'win32' 
      ? `start "" "${caminhoNormalizado}"` 
      : `xdg-open "${caminhoNormalizado}"`;
    
    exec(comando, (error) => {
      if (error) {
        console.error('Erro ao abrir arquivo:', error);
        return res.status(500).json({ 
          error: 'Erro ao abrir arquivo', 
          detalhes: error.message 
        });
      }
      
      res.json({ 
        success: true, 
        mensagem: 'Arquivo aberto com sucesso', 
        caminho: caminhoNormalizado 
      });
    });
  } catch (err) {
    console.error('Erro ao processar solicitação:', err);
    res.status(500).json({ 
      error: 'Erro ao processar solicitação', 
      detalhes: err.message 
    });
  }
});

// Rota para verificar se um arquivo existe
router.get('/verificar', (req, res) => {
  try {
    const { caminho } = req.query;
    
    if (!caminho) {
      return res.status(400).json({ error: 'Caminho do arquivo não especificado' });
    }
    
    const caminhoNormalizado = normalizarCaminho(caminho, false);
    const existe = fs.existsSync(caminhoNormalizado);
    
    res.json({
      existe,
      caminho: caminhoNormalizado
    });
  } catch (err) {
    console.error('Erro ao verificar arquivo:', err);
    res.status(500).json({ error: 'Erro ao verificar arquivo' });
  }
});

export default function(pool, poolConnect) {
  // Rota para buscar todos os documentos vinculados agrupados por imóvel
  router.get('/todos-vinculados', async (req, res) => {
    try {
      await poolConnect;
      console.log('Buscando todos os documentos vinculados...');
      
      // Buscar todos os imóveis principais (que não têm ImovelPaiId)
      const imoveisPrincipaisResult = await pool.request().query(`
        SELECT 
          i.Id, 
          i.Matricula, 
          i.Localizacao,
          i.TipoImovel,
          i.Finalidade
        FROM Imoveis i
        WHERE i.ImovelPaiId IS NULL
      `);
      
      // Estrutura para armazenar os imóveis principais com seus documentos e imóveis secundários
      const imoveisPrincipais = [];
      
      // Para cada imóvel principal
      for (const imovelPrincipal of imoveisPrincipaisResult.recordset) {
        // Buscar documentos do imóvel principal
        const documentosResult = await pool.request().query(`
          SELECT 
            d.Id, 
            d.ImovelId, 
            d.Caminho, 
            d.Nome, 

            d.DataCriacao,
            i.Matricula,
            i.Objeto,
            i.Localizacao,
            i.ImovelPaiId,
            CASE WHEN i.ImovelPaiId IS NULL THEN 'Principal' ELSE 'Secundário' END AS TipoRelacao,
            i.TipoImovel
          FROM Documentos d
          INNER JOIN Imoveis i ON d.ImovelId = i.Id
          WHERE d.ImovelId = '${imovelPrincipal.Id}'
        `);
        
        // Buscar imóveis secundários
        const imoveisSecundariosResult = await pool.request().query(`
          SELECT 
            i.Id, 
            i.Matricula, 
            i.Localizacao,
            i.TipoImovel,
            i.Finalidade
          FROM Imoveis i
          WHERE i.ImovelPaiId = '${imovelPrincipal.Id}'
        `);
        
        // Estrutura para armazenar os imóveis secundários com seus documentos
        const imoveisSecundarios = [];
        
        // Para cada imóvel secundário
        for (const imovelSecundario of imoveisSecundariosResult.recordset) {
          // Buscar documentos do imóvel secundário
          const documentosSecundariosResult = await pool.request().query(`
            SELECT 
              d.Id, 
              d.ImovelId, 
              d.Caminho, 
              d.Nome, 
  
              d.DataCriacao,
              i.Matricula,
              i.Objeto,
              i.Localizacao,
              i.ImovelPaiId,
              'Secundário' AS TipoRelacao,
              i.TipoImovel
            FROM Documentos d
            INNER JOIN Imoveis i ON d.ImovelId = i.Id
            WHERE d.ImovelId = '${imovelSecundario.Id}'
          `);
          
          // Adicionar imóvel secundário com seus documentos
          imoveisSecundarios.push({
            ...imovelSecundario,
            documentos: documentosSecundariosResult.recordset
          });
        }
        
        // Adicionar imóvel principal com seus documentos e imóveis secundários
        imoveisPrincipais.push({
          ...imovelPrincipal,
          documentos: documentosResult.recordset,
          imoveisSecundarios
        });
      }
      
      res.json(imoveisPrincipais);
    } catch (err) {
      console.error('Erro ao listar todos os documentos:', err);
      res.status(500).json({ error: 'Erro ao listar todos os documentos: ' + err.message });
    }
  });
  
  // Rota para vincular documento a um imóvel
  router.post('/vincular', async (req, res) => {
    try {
      await poolConnect;
      
      const { imovelId, caminho, nome, isAbsolutePath } = req.body;
      
      if (!imovelId || !caminho) {
        return res.status(400).json({ error: 'ID do imóvel e caminho do documento são obrigatórios' });
      }
      
      const caminhoNormalizado = normalizarCaminho(caminho, isAbsolutePath);
      const nomeDocumento = nome || path.basename(caminhoNormalizado);
      
      // Inserir na tabela Documentos
      const result = await pool.request()
        .input('ImovelId', imovelId)
        .input('Caminho', caminhoNormalizado)
        .input('Nome', nomeDocumento)
        .query(`
          INSERT INTO Documentos (ImovelId, Caminho, Nome)
          VALUES (@ImovelId, @Caminho, @Nome);
          SELECT SCOPE_IDENTITY() AS Id;
        `);
      
      const documentoId = result.recordset[0].Id;
      
      res.json({
        success: true,
        documentoId,
        mensagem: 'Documento vinculado com sucesso',
        documento: {
          id: documentoId,
          imovelId,
          caminho: caminhoNormalizado,
          nome: nomeDocumento
        }
      });
    } catch (err) {
      console.error('Erro ao vincular documento:', err);
      res.status(500).json({ error: 'Erro ao vincular documento', detalhes: err.message });
    }
  });
  
  // Rota para listar documentos de um imóvel
  router.get('/imovel/:id', async (req, res) => {
    try {
      await poolConnect;
      
      const { id } = req.params;
      
      const result = await pool.request()
        .input('ImovelId', id)
        .query(`
          SELECT Id, ImovelId, Caminho, Nome, DataCriacao
          FROM Documentos
          WHERE ImovelId = @ImovelId
          ORDER BY DataCriacao DESC
        `);
      
      res.json(result.recordset);
    } catch (err) {
      console.error('Erro ao listar documentos do imóvel:', err);
      res.status(500).json({ error: 'Erro ao listar documentos do imóvel' });
    }
  });
  
  // Rota para listar todos os documentos
  router.get('/todos', async (req, res) => {
    try {
      await poolConnect;
      
      const result = await pool.request().query(`
        SELECT d.Id, d.ImovelId, d.Caminho, d.Nome, d.DataCriacao,
               i.Objeto, i.Matricula, i.ImovelPaiId
        FROM Documentos d
        JOIN Imoveis i ON d.ImovelId = i.Id
        ORDER BY d.DataCriacao DESC
      `);
      
      res.json(result.recordset);
    } catch (err) {
      console.error('Erro ao listar todos os documentos:', err);
      res.status(500).json({ error: 'Erro ao listar todos os documentos' });
    }
  });
  
  // Rota para excluir um documento
  router.delete('/:id', async (req, res) => {
    try {
      await poolConnect;
      
      const { id } = req.params;
      
      const result = await pool.request()
        .input('Id', id)
        .query(`
          DELETE FROM Documentos
          WHERE Id = @Id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      res.json({
        success: true,
        mensagem: 'Documento excluído com sucesso'
      });
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      res.status(500).json({ error: 'Erro ao excluir documento' });
    }
  });
  
  return router;
}
