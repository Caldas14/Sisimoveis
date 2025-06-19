import express from 'express';
import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo de configuração de documentos
const configPath = path.join(__dirname, '..', 'documentos-config.json');

// Função para ler a configuração de documentos
function lerConfigDocumentos() {
  try {
    if (!fs.existsSync(configPath)) {
      // Criar arquivo de configuração vazio se não existir
      const configPadrao = {
        diretoriosDocumentos: []
      };
      console.log('Arquivo de configuração não encontrado, criando com estrutura vazia');
      fs.writeFileSync(configPath, JSON.stringify(configPadrao, null, 2));
      return configPadrao;
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    console.log(`Configuração de documentos carregada: ${config.diretoriosDocumentos.length} diretórios configurados`);
    return config;
  } catch (err) {
    console.error('Erro ao ler configuração de documentos:', err);
    return { diretoriosDocumentos: [] };
  }
}

// Função para salvar a configuração de documentos
function salvarConfigDocumentos(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error('Erro ao salvar configuração de documentos:', err);
    return false;
  }
}

// Função para normalizar caminhos de arquivos
function normalizarCaminho(caminho, isAbsolutePath) {
  if (!caminho) return null;
  
  // Substituir barras invertidas duplas por barras invertidas simples
  let caminhoNormalizado = caminho.replace(/\\\\/g, '\\');
  
  // Se não for um caminho absoluto, tentar resolver para um caminho absoluto
  if (!isAbsolutePath && !path.isAbsolute(caminhoNormalizado)) {
    // Obter a lista de diretórios configurados
    const { diretoriosDocumentos } = lerConfigDocumentos();
    
    // Verificar se o arquivo existe em algum dos diretórios configurados
    for (const diretorio of diretoriosDocumentos) {
      const caminhoCompleto = path.join(diretorio, caminhoNormalizado);
      if (fs.existsSync(caminhoCompleto)) {
        return caminhoCompleto;
      }
    }
  }
  
  return caminhoNormalizado;
}

// Função para criar o router com acesso ao pool de conexão
export default function(pool, poolConnect) {
  // Rota para obter configurações de documentos
  router.get('/config', (req, res) => {
    try {
      const config = lerConfigDocumentos();
      res.json(config);
    } catch (err) {
      console.error('Erro ao obter configurações de documentos:', err);
      res.status(500).json({ error: 'Erro ao obter configurações de documentos' });
    }
  });
  
  // Rota para salvar configurações de documentos
  router.post('/config', (req, res) => {
    try {
      const { diretoriosDocumentos } = req.body;
      
      if (!Array.isArray(diretoriosDocumentos)) {
        return res.status(400).json({ error: 'Formato inválido. diretoriosDocumentos deve ser um array.' });
      }
      
      // Validar diretórios
      const diretoriosValidos = diretoriosDocumentos.filter(dir => {
        try {
          return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
        } catch (err) {
          return false;
        }
      });
      
      // Salvar configurações
      const config = { diretoriosDocumentos: diretoriosValidos };
      const sucesso = salvarConfigDocumentos(config);
      
      if (sucesso) {
        res.json({ 
          success: true, 
          message: 'Configurações salvas com sucesso',
          diretoriosValidos,
          diretoriosInvalidos: diretoriosDocumentos.filter(dir => !diretoriosValidos.includes(dir))
        });
      } else {
        res.status(500).json({ error: 'Erro ao salvar configurações' });
      }
    } catch (err) {
      console.error('Erro ao salvar configurações de documentos:', err);
      res.status(500).json({ error: 'Erro ao salvar configurações de documentos' });
    }
  });
  // Rota para listar todos os documentos
  router.get('/', async (req, res) => {
    try {
      await poolConnect;
      const result = await pool.request().query(`
        SELECT 
          d.Id, 
          d.ImovelId, 
          d.Caminho, 
          d.Nome, 

          d.DataCriacao,
          i.Matricula as MatriculaImovel
        FROM DocumentosImoveis d
        LEFT JOIN Imoveis i ON d.ImovelId = i.Id
        ORDER BY d.DataCriacao DESC
      `);
      
      res.json(result.recordset);
    } catch (err) {
      console.error('Erro ao listar documentos:', err);
      res.status(500).json({ error: 'Erro ao listar documentos' });
    }
  });
  
  // Rota para listar documentos por imóvel
  router.get('/imovel/:id', async (req, res) => {
    try {
      await poolConnect;
      // Adicionar log para debug
      console.log('Buscando documentos para o imóvel:', req.params.id);
      
      const result = await pool.request().query(`
        SELECT 
          d.Id, 
          d.ImovelId, 
          d.Caminho, 
          d.Nome, 

          d.DataCriacao
        FROM DocumentosImoveis d
        WHERE d.ImovelId = '${req.params.id}'
        ORDER BY d.DataCriacao DESC
      `);
      
      res.json(result.recordset);
    } catch (err) {
      console.error('Erro ao listar documentos do imóvel:', err);
      res.status(500).json({ error: 'Erro ao listar documentos do imóvel' });
    }
  });
  
  // Rota para pesquisar documentos
  router.get('/pesquisar', async (req, res) => {
    try {
      await poolConnect;
      const { termo } = req.query;
      
      if (!termo) {
        return res.status(400).json({ error: 'Termo de pesquisa é obrigatório' });
      }
      
      console.log(`Pesquisando documentos com termo: ${termo}`);
      
      // Consulta que busca documentos que correspondem ao termo na matricula, nome ou caminho
      const query = `
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
          CASE WHEN i.ImovelPaiId IS NULL THEN 'Principal' ELSE 'Secundário' END AS TipoImovel
        FROM DocumentosImoveis d
        INNER JOIN Imoveis i ON d.ImovelId = i.Id
        WHERE 
          d.Nome LIKE '%${termo}%' OR 
          d.Caminho LIKE '%${termo}%' OR 
          i.Matricula LIKE '%${termo}%' OR
          i.Objeto LIKE '%${termo}%' OR
          i.Localizacao LIKE '%${termo}%'
        ORDER BY d.DataCriacao DESC
      `;
      
      const result = await pool.request().query(query);
      
      console.log(`Encontrados ${result.recordset.length} documentos`);
      res.json(result.recordset);
      
    } catch (err) {
      console.error('Erro ao pesquisar documentos:', err);
      res.status(500).json({ error: 'Erro ao pesquisar documentos: ' + err.message });
    }
  });

  // Rota para obter um documento específico
  router.get('/:id', async (req, res) => {
    try {
      await poolConnect;
      const result = await pool.request().query(`
        SELECT 
          d.Id, 
          d.ImovelId, 
          d.Caminho, 
          d.Nome, 

          d.DataCriacao,
          i.Matricula as MatriculaImovel
        FROM DocumentosImoveis d
        LEFT JOIN Imoveis i ON d.ImovelId = i.Id
        WHERE d.Id = '${req.params.id}'
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Erro ao obter documento:', err);
      res.status(500).json({ error: 'Erro ao obter documento' });
    }
  });
  
  // Rota para vincular documento a um imóvel
  router.post('/vincular', async (req, res) => {
    try {
      await poolConnect;
      // Extrair todos os possíveis nomes de parâmetros para compatibilidade
      const imovelId = req.body.imovelId;
      
      // Lidar com diferentes nomes de parâmetros
      const caminhoDocumento = req.body.caminhoDocumento || req.body.caminho;
      const nomeDocumento = req.body.nomeDocumento || req.body.nome;
      const tipoDocumento = req.body.tipoDocumento || req.body.tipo;
      const isAbsolutePath = req.body.isAbsolutePath;
      
      // Verificar se temos um tipo de documento válido
      if (!tipoDocumento) {
        console.error('Tipo de documento não fornecido');
      }
      
      console.log('Recebido pedido para vincular documento:', {
        imovelId, 
        caminho: caminhoDocumento, 
        nome: nomeDocumento, 
        tipo: tipoDocumento,
        isAbsolutePath
      });
      
      if (!imovelId || !caminhoDocumento) {
        return res.status(400).json({ error: 'ID do imóvel e caminho do documento são obrigatórios' });
      }
      
      // Normalizar o caminho do documento para garantir que seja um caminho válido
      // Preservar o caminho completo do arquivo
      let caminhoNormalizado = caminhoDocumento;
      
      // Verificar se o caminho é absoluto
      if (!caminhoNormalizado.includes(':\\') && !caminhoNormalizado.includes(':/')) {
        // Se não for um caminho absoluto, tentar resolver para um caminho absoluto
        try {
          // Verificar se é um caminho relativo
          if (caminhoNormalizado.startsWith('./') || caminhoNormalizado.startsWith('../')) {
            // Resolver caminho relativo para absoluto
            caminhoNormalizado = path.resolve(process.cwd(), caminhoNormalizado);
          } else {
            // Obter a lista de diretórios configurados do arquivo centralizado
            const diretoriosDocumentos = lerConfigDocumentos().diretoriosDocumentos || [];
            console.log(`Buscando documento em ${diretoriosDocumentos.length} diretórios configurados`);
            
            // Verificar se o arquivo existe em algum dos diretórios configurados
            for (const dir of diretoriosDocumentos) {
              const caminhoCompleto = path.join(dir, caminhoNormalizado);
              if (fs.existsSync(caminhoCompleto)) {
                caminhoNormalizado = caminhoCompleto;
                break;
              }
            }
          }
        } catch (err) {
          console.error('Erro ao resolver caminho:', err);
          // Manter o caminho original se houver erro
        }
      }
      
      console.log('Caminho normalizado:', caminhoNormalizado);
      
      // Garantir que temos um nome de documento válido
      // Se não for fornecido, extrair do caminho do arquivo
      let nomeDocumentoFinal = nomeDocumento;
      if (!nomeDocumentoFinal) {
        // Extrair o nome do arquivo do caminho
        nomeDocumentoFinal = caminhoNormalizado.split(/[\\/]/).pop() || 'documento';
      }
      
      // Verificar se o documento já está vinculado a este imóvel
      const checkResult = await pool.request()
        .input('imovelId', sql.UniqueIdentifier, imovelId)
        .input('caminho', sql.NVarChar, caminhoNormalizado)
        .query(`
          SELECT COUNT(*) as count FROM DocumentosImoveis 
          WHERE ImovelId = @imovelId AND Caminho = @caminho
        `);
      
      if (checkResult.recordset[0].count > 0) {
        return res.status(400).json({ error: 'Este documento já está vinculado a este imóvel' });
      }
      
      // Usando valor fixo para o campo Tipo enquanto não alteramos a estrutura da tabela
      
      // Inserir o documento na tabela DocumentosImoveis
      const result = await pool.request()
        .input('imovelId', sql.UniqueIdentifier, imovelId)
        .input('caminho', sql.NVarChar, caminhoNormalizado)
        .input('nome', sql.NVarChar, nomeDocumentoFinal)
        .query(`
          INSERT INTO DocumentosImoveis (ImovelId, Caminho, Nome, Tipo)
          OUTPUT INSERTED.*
          VALUES (@imovelId, @caminho, @nome, 'Documento')
        `);
      
      if (result.recordset.length === 0) {
        return res.status(500).json({ error: 'Erro ao vincular documento' });
      }
      
      // Log do documento inserido para debug
      console.log('Documento inserido:', result.recordset[0]);
      
      res.json({ 
        success: true, 
        message: 'Documento vinculado com sucesso', 
        documentoId: result.recordset[0].Id 
      });
    } catch (err) {
      console.error('Erro ao vincular documento:', err);
      res.status(500).json({ error: 'Erro ao vincular documento: ' + err.message });
    }
  });
  
  // Rota para desvincular documento de um imóvel
  router.delete('/:id', async (req, res) => {
    try {
      await poolConnect;
      
      // Verificar se o documento existe
      const checkResult = await pool.request().query(`
        SELECT * FROM DocumentosImoveis WHERE Id = '${req.params.id}'
      `);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      // Excluir o documento
      await pool.request().query(`
        DELETE FROM DocumentosImoveis WHERE Id = '${req.params.id}'
      `);
      
      res.json({ success: true, message: 'Documento desvinculado com sucesso' });
    } catch (err) {
      console.error('Erro ao desvincular documento:', err);
      res.status(500).json({ error: 'Erro ao desvincular documento' });
    }
  });

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
          i.TipoImovelId,
          i.FinalidadeId
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
            CASE WHEN i.ImovelPaiId IS NULL THEN 'Principal' ELSE 'Secundário' END AS TipoImovel
          FROM DocumentosImoveis d
          INNER JOIN Imoveis i ON d.ImovelId = i.Id
          WHERE d.ImovelId = '${imovelPrincipal.Id}'
        `);
        
        // Buscar imóveis secundários
        const imoveisSecundariosResult = await pool.request().query(`
          SELECT 
            i.Id, 
            i.Matricula, 
            i.Localizacao,
            i.TipoImovelId,
            i.FinalidadeId
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
              'Secundário' AS TipoImovel
            FROM DocumentosImoveis d
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
  
  return router;
}
