import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Importar rotas
import usuariosRoutes from './routes/usuarios.js';
import gerenciadorDocumentosRoutes from './routes/gerenciador-documentos.js';
import seletorArquivosRoutes from './routes/seletor-arquivos.js';
import documentosRoutes from './routes/documentos.js';
import abrirArquivoRoutes from './routes/abrir-arquivo.js';

// Configurar __dirname no ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3001;

// Configuração JWT
const JWT_SECRET = 'chave-secreta-do-sistema-cehop'; // Em produção, usar variável de ambiente

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Função para ler configuração do banco
function readDbConfig() {
  const configPath = path.join(__dirname, 'db-config.json');
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    return {
      user: config.user,
      password: config.password,
      database: config.database,
      server: config.server,
      port: config.port,
      options: config.options,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  } catch (err) {
    console.error('Erro ao ler configuração do banco:', err);
    return {
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'SistemaCadastroImoveis',
      server: process.env.DB_SERVER || 'localhost',
      port: Number(process.env.DB_PORT) || 1433,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }
}

// Configuração do banco de dados
let dbConfig = readDbConfig();

// Criar um pool global para ser reutilizado
let pool = new sql.ConnectionPool(dbConfig);
let poolConnect = pool.connect();

pool.on('error', err => {
  console.error('Erro no pool de conexão SQL:', err);
});

// Função para reconectar o pool com novas configurações
async function reconnectPool(newConfig) {
  try {
    // Fechar conexão existente
    if (pool) {
      await pool.close();
    }
    
    // Criar novo pool com novas configurações
    pool = new sql.ConnectionPool(newConfig);
    poolConnect = pool.connect();
    
    // Aguardar nova conexão
    await poolConnect;
    return true;
  } catch (err) {
    console.error('Erro ao reconectar pool:', err);
    return false;
  }
}

// Testar conexão com o banco de dados
async function testDatabaseConnection() {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return false;
  }
}

// Rota para testar a conexão com o banco de dados
app.get('/api/test-connection', async (req, res) => {
  const isConnected = await testDatabaseConnection();
  res.json({ success: isConnected });
});

// Função para salvar configuração do banco
function saveDbConfig(config) {
  const configPath = path.join(__dirname, 'db-config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error('Erro ao salvar configuração do banco:', err);
    return false;
  }
}

// Rota para buscar configurações do banco de dados
app.get('/api/db-config', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'db-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    res.json(config);
  } catch (err) {
    console.error('Erro ao ler configurações do banco:', err);
    res.status(500).json({ error: 'Erro ao ler configurações do banco' });
  }
});

// Rota para salvar configurações do banco de dados
app.post('/api/db-config', async (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validar configuração
    if (!newConfig.server || !newConfig.port || !newConfig.database || !newConfig.user || !newConfig.password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos os campos são obrigatórios'
      });
    }
    
    // Salvar configuração
    const saved = saveDbConfig(newConfig);
    if (!saved) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao salvar configurações'
      });
    }
    
    // Atualizar configuração do pool
    dbConfig = newConfig;
    
    // Testar a conexão com o novo banco
    try {
      // Primeiro salvar a nova configuração
      await reconnectPool(dbConfig);
      
      // Testar a conexão fazendo uma consulta simples
      const result = await pool.request().query('SELECT GETDATE() as serverTime');
      
      // Se chegou até aqui, a conexão foi bem sucedida
      res.json({ 
        success: true, 
        message: 'Configurações salvas e conexão estabelecida com sucesso',
        serverTime: result.recordset[0].serverTime,
        connectionStatus: 'Conectado ao banco de dados com sucesso'
      });
      
      // Enviar a resposta e aguardar ela ser enviada completamente
      res.json({ 
        success: true, 
        message: 'Configurações salvas e conexão estabelecida com sucesso',
        serverTime: result.recordset[0].serverTime,
        connectionStatus: 'Conectado ao banco de dados com sucesso'
      }).end(() => {
        // Após a resposta ser enviada, criar arquivo para reiniciar
        const restartPath = path.join(__dirname, 'restart.tmp');
        try {
          fs.writeFileSync(restartPath, new Date().toISOString());
          console.log('Arquivo de reinicialização criado');
          
          // Remover o arquivo após 2 segundos
          setTimeout(() => {
            try {
              if (fs.existsSync(restartPath)) {
                fs.unlinkSync(restartPath);
                console.log('Arquivo de reinicialização removido');
              }
            } catch (err) {
              console.error('Erro ao remover arquivo temporário:', err);
            }
          }, 2000);
        } catch (err) {
          console.error('Erro ao criar arquivo de reinicialização:', err);
        }
      });
      
    } catch (dbErr) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao conectar ao banco de dados',
        details: dbErr.message
      });
    }
  } catch (err) {
    console.error('Erro ao salvar configurações do banco:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao salvar configurações do banco',
      details: err.message 
    });
  }
});

// Rota para verificar o status do banco de dados
app.get('/api/db-status', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    const result = await pool.request().query('SELECT GETDATE() as serverTime');
    res.json({ 
      status: 'online',
      serverTime: result.recordset[0].serverTime,
      lastCheck: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro ao verificar status do banco:', err);
    res.json({ 
      status: 'offline',
      error: err.message,
      lastCheck: new Date().toISOString()
    });
  }
});

// Rota principal para listar imóveis
app.get('/api/imoveis', async (req, res) => {
  try {
    await poolConnect;
    
    console.log('Listando imóveis com filtros:', req.query);
    
    // Construir a consulta SQL com filtros opcionais
    let sql = 'SELECT * FROM vw_Imoveis WHERE 1=1';
    const params = [];
    
    // Adicionar filtros se fornecidos
    if (req.query.matricula) {
      sql += " AND Matricula LIKE '%' + @matricula + '%'";
      params.push({ name: 'matricula', value: req.query.matricula });
    }
    
    if (req.query.localizacao) {
      sql += " AND Localizacao LIKE '%' + @localizacao + '%'";
      params.push({ name: 'localizacao', value: req.query.localizacao });
    }
    
    if (req.query.tipoImovel) {
      sql += " AND TipoImovel = @tipoImovel";
      params.push({ name: 'tipoImovel', value: req.query.tipoImovel });
    }
    
    if (req.query.statusTransferencia) {
      sql += " AND StatusTransferencia = @statusTransferencia";
      params.push({ name: 'statusTransferencia', value: req.query.statusTransferencia });
    }
    
    if (req.query.apenasPrincipais === 'true') {
      sql += " AND ImovelPaiId IS NULL";
    }
    
    // Ordenar por data de cadastro
    sql += ' ORDER BY DataCadastro DESC';
    
    console.log('SQL Query:', sql);
    console.log('Parâmetros:', params);
    
    // Criar a request e adicionar os parâmetros
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.value);
    });
    
    const result = await request.query(sql);
    console.log(`Encontrados ${result.recordset.length} imóveis`);
    
    if (result.recordset.length > 0) {
      console.log('Exemplo do primeiro imóvel:', {
        id: result.recordset[0].Id,
        matricula: result.recordset[0].Matricula,
        area: result.recordset[0].Area
      });
    }
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao listar imóveis:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para consultar a view de imóveis
app.get('/api/imoveis/view', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    // Obter parâmetros da query
    const { tipoRelacao, tipoImovel, finalidade, limit } = req.query;
    
    console.log('Consultando view de imóveis com filtros:', { 
      tipoRelacao, 
      tipoImovel, 
      finalidade,
      limit
    });
    
    // Construir a consulta SQL com filtros opcionais
    let sql = `SELECT * FROM vw_Imoveis WHERE 1=1`;
    
    // Adicionar filtros se fornecidos
    if (tipoRelacao) {
      sql += ` AND TipoRelacao = '${tipoRelacao}'`;
    }
    
    if (tipoImovel) {
      sql += ` AND TipoImovel = '${tipoImovel}'`;
    }
    
    if (finalidade) {
      sql += ` AND Finalidade = '${finalidade}'`;
    }
    
    // Adicionar ordenação
    sql += ` ORDER BY DataCadastro DESC`;
    
    // Adicionar limite se fornecido
    if (limit && !isNaN(parseInt(limit))) {
      sql += ` OFFSET 0 ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`;
    }
    
    console.log('Executando consulta SQL na view:', sql);
    
    const result = await pool.request().query(sql);
    console.log(`Encontrados ${result.recordset.length} imóveis na view`);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao consultar view de imóveis:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar todos os imóveis
app.get('/api/imoveis', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    // Obter parâmetros da query
    const { matricula, localizacao, tipoImovel, statusTransferencia, apenasPrincipais } = req.query;
    
    console.log('Buscando imóveis com filtros:', { 
      matricula, 
      localizacao, 
      tipoImovel, 
      statusTransferencia, 
      apenasPrincipais 
    });
    
    // Construir a consulta SQL com filtros opcionais
    let sql = `
      SELECT 
        i.Id,
        i.Matricula,
        i.Localizacao,
        i.Objeto,
        i.TipoImovelId,
        ISNULL(ti.Nome, 'Desconhecido') as TipoImovel,
        i.FinalidadeId,
        ISNULL(f.Nome, 'Desconhecido') as Finalidade,
        i.StatusTransferenciaId,
        ISNULL(st.Nome, 'Desconhecido') as StatusTransferencia,
        i.ImovelPaiId,
        i.DataCadastro,
        i.DataAtualizacao,

        i.ValorVenal,
        i.RegistroIPTU,
        i.Latitude,
        i.Longitude,
        i.PontoReferencia,
        i.TipoPosseId,
        ISNULL(tp.Nome, 'Desconhecido') as TipoPosse,
        i.TipoUsoEdificacaoId,
        ISNULL(tue.Nome, 'Desconhecido') as TipoUsoEdificacao,
        i.Observacao
      FROM 
        Imoveis i
      LEFT JOIN 
        TiposImovel ti ON i.TipoImovelId = ti.Id
      LEFT JOIN 
        Finalidades f ON i.FinalidadeId = f.Id
      LEFT JOIN 
        StatusTransferencia st ON i.StatusTransferenciaId = st.Id
      LEFT JOIN 
        TiposPosse tp ON i.TipoPosseId = tp.Id
      LEFT JOIN 
        TiposUsoEdificacao tue ON i.TipoUsoEdificacaoId = tue.Id
      LEFT JOIN
        InfraestruturaImoveis infra ON i.Id = infra.ImovelId
      WHERE 1=1
    `;
    
    // Adicionar filtros se fornecidos
    if (matricula) {
      sql += ` AND i.Matricula LIKE '%${matricula}%'`;
    }
    
    if (localizacao) {
      sql += ` AND i.Localizacao LIKE '%${localizacao}%'`;
    }
    
    if (tipoImovel) {
      sql += ` AND ti.Nome = '${tipoImovel}'`;
    }
    
    if (statusTransferencia) {
      sql += ` AND st.Nome = '${statusTransferencia}'`;
    }
    
    // Filtrar apenas imóveis principais se solicitado
    if (apenasPrincipais === 'true') {
      sql += ` AND i.ImovelPaiId IS NULL`;
      console.log('Filtrando apenas imóveis principais');
    }
    
    // Adicionar ordenação
    sql += ` ORDER BY i.DataCadastro DESC`;
    
    console.log('Executando consulta SQL:', sql);
    
    const result = await pool.request().query(sql);
    console.log(`Encontrados ${result.recordset.length} imóveis`);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao buscar imóveis:', err);
  }
});

// Nota: A rota de login foi movida para o arquivo routes/usuarios.js

// Rota para verificar a validade do token JWT
app.get('/api/usuarios/verificar-token', (req, res) => {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ valid: false, message: 'Token não fornecido' });
    }
    
    // Extrair o token do formato 'Bearer TOKEN'
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ valid: false, message: 'Formato de token inválido' });
    }
    
    // Verificar o token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('Erro ao verificar token:', err.message);
        return res.status(401).json({ valid: false, message: 'Token inválido ou expirado' });
      }
      
      // Token válido
      return res.json({ 
        valid: true, 
        usuario: {
          id: decoded.id,
          nome: decoded.nome,
          nomeUsuario: decoded.nomeUsuario,
          cargoId: decoded.cargoId
        }
      });
    });
  } catch (err) {
    console.error('Erro ao verificar token:', err);
    res.status(500).json({ valid: false, message: 'Erro ao verificar token', details: err.message });
  }
});

// Rota para buscar imóveis secundários de um imóvel principal (versão completa)
app.get('/api/imoveis/:id/secundarios/completo', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    const imovelId = req.params.id;
    
    // Verificar se o imóvel existe
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM Imoveis WHERE Id = '${imovelId}'
    `);
    
    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    
    // Buscar os imóveis secundários completos usando a view
    const secundariosResult = await pool.request().query(`
      SELECT * FROM vw_Imoveis WHERE ImovelPaiId = '${imovelId}' ORDER BY DataCadastro DESC
    `);
    
    console.log(`Encontrados ${secundariosResult.recordset.length} imóveis secundários para o imóvel ${imovelId}`);
    
    res.status(200).json(secundariosResult.recordset);
  } catch (err) {
    console.error('Erro ao buscar imóveis secundários:', err);
    res.status(500).json({ error: 'Erro ao buscar imóveis secundários', details: err.message });
  }
});

// Rota para excluir um imóvel por ID
app.delete('/api/imoveis/:id', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    const imovelId = req.params.id;
    const cascade = req.query.cascade === 'true';
    
    console.log(`Solicitada exclusão do imóvel ${imovelId}${cascade ? ' com exclusão em cascata' : ''}`);
    
    // Verificar se o imóvel existe
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM Imoveis WHERE Id = '${imovelId}'
    `);
    
    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    
    // Verificar se o imóvel tem imóveis secundários
    const secundariosResult = await pool.request().query(`
      SELECT Id, Matricula, Objeto FROM Imoveis WHERE ImovelPaiId = '${imovelId}'
    `);
    
    const temSecundarios = secundariosResult.recordset.length > 0;
    
    // Se tem secundários e não foi solicitada exclusão em cascata, retornar erro
    if (temSecundarios && !cascade) {
      console.log(`Imóvel ${imovelId} tem ${secundariosResult.recordset.length} imóveis secundários e exclusão em cascata não foi solicitada`);
      return res.status(400).json({
        error: 'Não é possível excluir um imóvel principal que possui imóveis secundários',
        message: `Este imóvel possui ${secundariosResult.recordset.length} imóveis secundários. Você precisa excluir os imóveis secundários primeiro ou solicitar a exclusão em cascata.`,
        secundarios: secundariosResult.recordset
      });
    }
    
    // Se foi solicitada exclusão em cascata e tem secundários, excluir os secundários primeiro
    if (cascade && temSecundarios) {
      console.log(`Excluindo ${secundariosResult.recordset.length} imóveis secundários do imóvel ${imovelId}`);
      
      // Excluir infraestrutura dos imóveis secundários
      for (const secundario of secundariosResult.recordset) {
        try {
          await pool.request().query(`
            DELETE FROM InfraestruturaImoveis WHERE ImovelId = '${secundario.Id}'
          `);
          console.log(`Infraestrutura do imóvel secundário ${secundario.Id} excluída`);
        } catch (err) {
          console.error(`Erro ao excluir infraestrutura do imóvel secundário ${secundario.Id}:`, err);
          // Continuar mesmo com erro, pois o imóvel pode não ter infraestrutura
        }
      }
      
      // Excluir todos os imóveis secundários
      await pool.request().query(`
        DELETE FROM Imoveis WHERE ImovelPaiId = '${imovelId}'
      `);
      console.log(`Imóveis secundários do imóvel ${imovelId} excluídos com sucesso`);
    }
    
    // Excluir infraestrutura do imóvel principal
    try {
      await pool.request().query(`
        DELETE FROM InfraestruturaImoveis WHERE ImovelId = '${imovelId}'
      `);
      console.log(`Infraestrutura do imóvel ${imovelId} excluída`);
    } catch (err) {
      console.error(`Erro ao excluir infraestrutura do imóvel ${imovelId}:`, err);
      // Continuar mesmo com erro, pois o imóvel pode não ter infraestrutura
    }
    
    // Excluir o imóvel principal
    await pool.request().query(`
      DELETE FROM Imoveis WHERE Id = '${imovelId}'
    `);
    
    console.log(`Imóvel ${imovelId} excluído com sucesso`);
    
    // Retornar sucesso
    res.status(200).json({
      success: true,
      message: temSecundarios && cascade 
        ? `Imóvel e ${secundariosResult.recordset.length} imóveis secundários excluídos com sucesso` 
        : 'Imóvel excluído com sucesso'
    });
  } catch (err) {
    console.error('Erro ao excluir imóvel:', err);
    res.status(500).json({ error: 'Erro ao excluir imóvel', details: err.message });
  }
});

// Rota para buscar um imóvel por ID
app.get('/api/imoveis/:id', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    // Buscar dados básicos do imóvel diretamente da tabela Imoveis
    const result = await pool.request().query(`
      SELECT *
      FROM Imoveis
      WHERE Id = '${req.params.id}';
    `);
    
    // Verificar se o imóvel foi encontrado
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    
    const imovel = result.recordset[0];
    
    // Buscar dados de infraestrutura do imóvel
    try {
      // Verificar se a tabela de infraestrutura existe
      const tableCheckResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'InfraestruturaImoveis'
      `);
      
      if (tableCheckResult.recordset.length > 0) {
        const infraResult = await pool.request().query(`
          SELECT * FROM InfraestruturaImoveis WHERE ImovelId = '${req.params.id}'
        `);
        
        if (infraResult.recordset.length > 0) {
          // Função para converter valores numéricos ou strings para booleanos
          function convertToBoolean(value) {
            // Se for número, verificar se é diferente de zero
            if (typeof value === 'number') return value !== 0;
            // Se for string, verificar se é '1', 'true', 'sim' ou 'yes'
            if (typeof value === 'string') {
              const lowerValue = value.toLowerCase();
              return lowerValue === '1' || lowerValue === 'true' || lowerValue === 'sim' || lowerValue === 'yes';
            }
            // Para outros tipos, usar conversão padrão do JavaScript
            return Boolean(value);
          }
          
          // Adicionar dados de infraestrutura ao objeto do imóvel
          imovel.Infraestrutura = {
            Agua: convertToBoolean(infraResult.recordset[0].Agua),
            Esgoto: convertToBoolean(infraResult.recordset[0].Esgoto),
            Energia: convertToBoolean(infraResult.recordset[0].Energia),
            Pavimentacao: convertToBoolean(infraResult.recordset[0].Pavimentacao),
            Iluminacao: convertToBoolean(infraResult.recordset[0].Iluminacao),
            ColetaLixo: convertToBoolean(infraResult.recordset[0].ColetaLixo)
          };
          
          console.log('Infraestrutura convertida para booleanos:', imovel.Infraestrutura);
        } else {
          // Se não encontrou infraestrutura, definir valores padrão (todos false)
          imovel.Infraestrutura = {
            Agua: false,
            Esgoto: false,
            Energia: false,
            Pavimentacao: false,
            Iluminacao: false,
            ColetaLixo: false
          };
          console.log('Infraestrutura não encontrada. Usando valores padrão (todos false).');
        }
      }
    } catch (infraErr) {
      console.error('Erro ao buscar infraestrutura do imóvel (não crítico):', infraErr);
      // Não falhar a requisição principal se houver erro ao buscar infraestrutura
    }
    
    // Log para debug - verificar os dados do imóvel
    console.log('Dados do imóvel recuperados do banco de dados:');
    console.log('- ID:', imovel.Id);
    console.log('- Matrícula:', imovel.Matricula);
    console.log('- Infraestrutura:', imovel.Infraestrutura);
    
    // Buscar matrículas originadas diretamente da tabela Imoveis
    try {
      const matriculasResult = await pool.request().query(`
        SELECT MatriculasOriginadas 
        FROM Imoveis 
        WHERE Id = '${req.params.id}'
      `);
      
      if (matriculasResult.recordset.length > 0 && matriculasResult.recordset[0].MatriculasOriginadas) {
        imovel.MatriculasOriginadas = matriculasResult.recordset[0].MatriculasOriginadas;
        console.log('- Matrículas Originadas (da tabela Imoveis):', imovel.MatriculasOriginadas);
      }
    } catch (matriculasErr) {
      console.error('Erro ao buscar matrículas originadas (não crítico):', matriculasErr);
    }
    
    res.json(imovel);
  } catch (err) {
    console.error('Erro ao buscar imóvel por ID:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar infraestrutura de um imóvel
app.get('/api/imoveis/:id/infraestrutura', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    // Verificar se a tabela de infraestrutura existe
    const tableCheckResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'InfraestruturaImoveis'
    `);
    
    if (tableCheckResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tabela de infraestrutura não encontrada' });
    }
    
    // Buscar dados de infraestrutura
    const result = await pool.request().query(`
      SELECT * FROM InfraestruturaImoveis WHERE ImovelId = '${req.params.id}'
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Infraestrutura não encontrada para este imóvel' });
    }
    
    // Formatar os dados para retornar como booleanos em vez de 0/1
    const infraestrutura = {
      agua: result.recordset[0].Agua === 1,
      esgoto: result.recordset[0].Esgoto === 1,
      energia: result.recordset[0].Energia === 1,
      pavimentacao: result.recordset[0].Pavimentacao === 1,
      iluminacao: result.recordset[0].Iluminacao === 1,
      coletaLixo: result.recordset[0].ColetaLixo === 1
    };
    
    res.json(infraestrutura);
  } catch (err) {
    console.error('Erro ao buscar infraestrutura do imóvel:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar imóveis secundários
app.get('/api/imoveis/:id/secundarios', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    const result = await pool.request().query(`
      SELECT 
        i.Id,
        i.Matricula,
        i.Localizacao,
        i.AreaM2 as Area,
        i.Objeto,
        i.TipoImovelId,
        ISNULL(ti.Nome, 'Desconhecido') as TipoImovel,
        i.FinalidadeId,
        ISNULL(f.Nome, 'Desconhecido') as Finalidade,
        i.StatusTransferenciaId,
        ISNULL(st.Nome, 'Desconhecido') as StatusTransferencia,
        i.ImovelPaiId,
        i.DataCadastro,
        i.DataAtualizacao,    
        i.MatriculasOriginadas,
        i.ValorVenal,
        i.RegistroIPTU,
        i.Latitude,
        i.Longitude,
        i.PontoReferencia,
        i.TipoPosseId,
        ISNULL(tp.Nome, 'Desconhecido') as TipoPosse,
        i.TipoUsoEdificacaoId,
        ISNULL(tue.Nome, 'Desconhecido') as TipoUsoEdificacao,
        i.Observacao
      FROM 
        Imoveis i
      LEFT JOIN 
        TiposImovel ti ON i.TipoImovelId = ti.Id
      LEFT JOIN 
        Finalidades f ON i.FinalidadeId = f.Id
      LEFT JOIN 
        StatusTransferencia st ON i.StatusTransferenciaId = st.Id
      LEFT JOIN 
        TiposPosse tp ON i.TipoPosseId = tp.Id
      LEFT JOIN 
        TiposUsoEdificacao tue ON i.TipoUsoEdificacaoId = tue.Id
      WHERE 
        i.ImovelPaiId = '${req.params.id}'
      ORDER BY 
        i.DataCadastro DESC
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao buscar imóveis secundários:', err);
    res.status(500).json({ error: err.message });
  }
});

// Função para sanitizar strings para SQL
function sanitizeSqlString(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''");
}

// Função para converter para número ou retornar 0, com limite para evitar overflow
function toNumberOrZero(val, maxValue = 9999) {
  if (val === null || val === undefined || val === '') return 0;
  
  // Remover caracteres não numéricos, exceto ponto decimal
  const cleanedVal = String(val).replace(/[^0-9.]/g, '');
  const num = Number(cleanedVal);
  
  if (isNaN(num)) return 0;
  
  // Limitar o valor para evitar overflow
  return Math.min(num, maxValue);
}

// Rota para buscar imóveis secundários de um imóvel principal
app.get('/api/imoveis/:id/secundarios', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    console.log('Buscando imóveis secundários para o imóvel:', req.params.id);
    
    const result = await pool.request().query(`
      SELECT *
      FROM vw_Imoveis
      WHERE ImovelPaiId = '${req.params.id}'
      ORDER BY DataCadastro DESC
    `);
    
    console.log('Imóveis secundários encontrados:', result.recordset.length);
    console.log('Dados dos imóveis secundários:', result.recordset.map(i => ({
      id: i.Id,
      matricula: i.Matricula,
      area: i.Area || i.AreaM2
    })));
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao buscar imóveis secundários:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para cadastrar um novo imóvel
app.post('/api/imoveis', async (req, res) => {
  try {
    console.log('Iniciando cadastro de imóvel:', JSON.stringify(req.body, null, 2));
    await poolConnect; // Aguardar a conexão ser estabelecida
    const imovel = req.body;
    
    // Obter IDs das tabelas de referência
    let tipoImovelId, finalidadeId, statusTransferenciaId, tipoPosseId, tipoUsoEdificacaoId;
    
    // Buscar ID do tipo de imóvel
    if (imovel.tipoImovel) {
      const tipoImovelResult = await pool.request().query(`
        SELECT Id FROM TiposImovel WHERE Nome = '${imovel.tipoImovel}'
      `);
      tipoImovelId = tipoImovelResult.recordset.length > 0 ? tipoImovelResult.recordset[0].Id : null;
    }
    
    // Buscar ID da finalidade
    if (imovel.finalidade) {
      const finalidadeResult = await pool.request().query(`
        SELECT Id FROM Finalidades WHERE Nome = '${imovel.finalidade}'
      `);
      finalidadeId = finalidadeResult.recordset.length > 0 ? finalidadeResult.recordset[0].Id : null;
    }
    
    // Buscar ID do status de transferência
    if (imovel.statusTransferencia) {
      const statusResult = await pool.request().query(`
        SELECT Id FROM StatusTransferencia WHERE Nome = '${imovel.statusTransferencia}'
      `);
      statusTransferenciaId = statusResult.recordset.length > 0 ? statusResult.recordset[0].Id : null;
    }
    
    // Se não encontrou o status de transferência, buscar um valor padrão
    if (!statusTransferenciaId) {
      console.log(`Aviso: Status de transferência '${imovel.statusTransferencia}' não encontrado. Usando valor padrão.`);
      const defaultStatusResult = await pool.request().query(`
        SELECT TOP 1 Id FROM StatusTransferencia ORDER BY Id
      `);
      
      if (defaultStatusResult.recordset.length > 0) {
        statusTransferenciaId = defaultStatusResult.recordset[0].Id;
        console.log(`Usando status de transferência padrão com ID: ${statusTransferenciaId}`);
      } else {
        // Se não houver nenhum status de transferência cadastrado, criar um padrão
        console.log('Nenhum status de transferência encontrado. Criando um padrão.');
        const defaultStatusId = generateUUID();
        await pool.request().query(`
          INSERT INTO StatusTransferencia (Id, Nome)
          VALUES ('${defaultStatusId}', 'Pendente')
        `);
        statusTransferenciaId = defaultStatusId;
      }
    }
    
    // Buscar ID do tipo de posse
    if (imovel.tipoPosse) {
      const tipoPosseResult = await pool.request().query(`
        SELECT Id FROM TiposPosse WHERE Nome = '${imovel.tipoPosse}'
      `);
      tipoPosseId = tipoPosseResult.recordset.length > 0 ? tipoPosseResult.recordset[0].Id : null;
      
      // Se não encontrou o tipo de posse, buscar um valor padrão
      if (!tipoPosseId) {
        console.log(`Aviso: Tipo de posse '${imovel.tipoPosse}' não encontrado. Usando valor padrão.`);
        const defaultPosseResult = await pool.request().query(`
          SELECT TOP 1 Id FROM TiposPosse ORDER BY Id
        `);
        
        if (defaultPosseResult.recordset.length > 0) {
          tipoPosseId = defaultPosseResult.recordset[0].Id;
          console.log(`Usando tipo de posse padrão com ID: ${tipoPosseId}`);
        } else {
          // Se não houver nenhum tipo de posse cadastrado, criar um padrão
          console.log('Nenhum tipo de posse encontrado. Criando um padrão.');
          const defaultPosseId = generateUUID();
          await pool.request().query(`
            INSERT INTO TiposPosse (Id, Nome)
            VALUES ('${defaultPosseId}', 'Próprio')
          `);
          tipoPosseId = defaultPosseId;
        }
      }
    }
    
    // Buscar ID do tipo de uso de edificação
    if (imovel.tipoUsoEdificacao) {
      const tipoUsoResult = await pool.request().query(`
        SELECT Id FROM TiposUsoEdificacao WHERE Nome = '${imovel.tipoUsoEdificacao}'
      `);
      tipoUsoEdificacaoId = tipoUsoResult.recordset.length > 0 ? tipoUsoResult.recordset[0].Id : null;
      
      // Se não encontrou o tipo de uso, buscar um valor padrão
      if (!tipoUsoEdificacaoId) {
        console.log(`Aviso: Tipo de uso de edificação '${imovel.tipoUsoEdificacao}' não encontrado. Usando valor padrão.`);
        const defaultUsoResult = await pool.request().query(`
          SELECT TOP 1 Id FROM TiposUsoEdificacao ORDER BY Id
        `);
        
        if (defaultUsoResult.recordset.length > 0) {
          tipoUsoEdificacaoId = defaultUsoResult.recordset[0].Id;
          console.log(`Usando tipo de uso de edificação padrão com ID: ${tipoUsoEdificacaoId}`);
        } else {
          // Se não houver nenhum tipo de uso cadastrado, criar um padrão
          console.log('Nenhum tipo de uso de edificação encontrado. Criando um padrão.');
          const defaultUsoId = generateUUID();
          await pool.request().query(`
            INSERT INTO TiposUsoEdificacao (Id, Nome)
            VALUES ('${defaultUsoId}', 'Residencial')
          `);
          tipoUsoEdificacaoId = defaultUsoId;
        }
      }
    }
    
    // Obter informações do usuário que está cadastrando o imóvel
    let usuarioId = '00000000-0000-0000-0000-000000000000';
    let usuarioNome = 'Sistema';
    
    // Verificar se foram enviados dados do usuário no payload
    if (imovel.usuarioCadastroId && imovel.usuarioCadastroNome) {
      console.log('Dados do usuário recebidos no payload:', imovel.usuarioCadastroId, imovel.usuarioCadastroNome);
      usuarioId = imovel.usuarioCadastroId;
      usuarioNome = imovel.usuarioCadastroNome;
    } else {
      console.log('Nenhum dado de usuário recebido no payload. Usando valores padrão.');
    }
    
    // Função para gerar UUID v4 sem depender de require
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    // Inserir o imóvel
    // Gerar um UUID v4 para o ID do imóvel
    
    const imovelId = generateUUID();
    console.log('ID gerado para o novo imóvel:', imovelId);
    
    // Sanitizar e preparar os dados com limites para evitar overflow
    const matricula = sanitizeSqlString(imovel.matricula);
    const localizacao = sanitizeSqlString(imovel.localizacao);
    const objeto = sanitizeSqlString(imovel.objeto);
    const area = toNumberOrZero(imovel.area, 999999); // Limite maior para área
    const valorVenal = toNumberOrZero(imovel.valorVenal, 9999999); // Limite maior para valor venal
    const registroIPTU = sanitizeSqlString(imovel.registroIPTU);
    const latitude = toNumberOrZero(imovel.latitude, 90); // Limite para latitude (-90 a 90)
    const longitude = toNumberOrZero(imovel.longitude, 180); // Limite para longitude (-180 a 180)
    const pontoReferencia = sanitizeSqlString(imovel.pontoReferencia);
    const observacao = sanitizeSqlString(imovel.observacao);
    const matriculasOriginadas = sanitizeSqlString(imovel.matriculasOriginadas);
    
    // Verificar se a matrícula já existe
    const verificacaoMatricula = await pool.request().query(`
      SELECT COUNT(*) as count FROM Imoveis WHERE Matricula = '${matricula}'
    `);
    
    if (verificacaoMatricula.recordset[0].count > 0) {
      console.log(`Erro: Matrícula ${matricula} já cadastrada no sistema`);
      return res.status(400).json({ 
        error: 'Matrícula já cadastrada', 
        message: `A matrícula ${matricula} já está cadastrada no sistema. Por favor, utilize outra matrícula.` 
      });
    }
    
    console.log('Preparando para inserir imóvel no banco de dados com os seguintes dados:');
    console.log('- Matrícula:', matricula);
    console.log('- Localização:', localizacao);
    console.log('- Área:', area);
    console.log('- Objeto:', objeto);
    console.log('- Tipo Imóvel ID:', tipoImovelId);
    console.log('- Finalidade ID:', finalidadeId);
    console.log('- Status Transferência ID:', statusTransferenciaId);
    console.log('- Imóvel Pai ID:', imovel.imovelPaiId || 'NULL');
    console.log('- Infraestrutura:', JSON.stringify(imovel.infraestrutura));
    
    // Construir a query de inserção
    const insertQuery = `
      INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        ValorVenal, RegistroIPTU, Latitude, Longitude, PontoReferencia, 
        TipoPosseId, TipoUsoEdificacaoId, Observacao, MatriculasOriginadas,
        UsuarioCadastroId, UsuarioCadastroNome, UsuarioAtualizacaoId
      )
      VALUES (
        '${imovelId}', 
        '${matricula}', 
        '${localizacao}', 
        ${area}, 
        '${objeto}', 
        ${tipoImovelId || 'NULL'}, 
        ${finalidadeId || 'NULL'}, 
        ${statusTransferenciaId}, 
        ${imovel.imovelPaiId ? `'${imovel.imovelPaiId}'` : 'NULL'}, 
        GETDATE(), 
        GETDATE(),
        ${valorVenal}, 
        '${registroIPTU}', 
        ${latitude}, 
        ${longitude}, 
        '${pontoReferencia}', 
        ${tipoPosseId}, 
        ${tipoUsoEdificacaoId}, 
        '${observacao}',
        '${matriculasOriginadas}',
        '${usuarioId}', 
        '${sanitizeSqlString(usuarioNome)}', 
        '${usuarioId}'
      )
    `;
    
    console.log('Executando query de inserção:', insertQuery);
    await pool.request().query(insertQuery);
    
    // Verificar se a tabela de infraestrutura existe
    try {
      // Verificar se a tabela InfraestruturaImoveis existe
      const tableCheckResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'InfraestruturaImoveis'
      `);
      
      // Se a tabela existir e tiver infraestrutura fornecida
      if (tableCheckResult.recordset.length > 0 && imovel.infraestrutura) {
        console.log('Cadastrando infraestrutura para o imóvel:', imovelId);
        console.log('Valores de infraestrutura recebidos:', JSON.stringify(imovel.infraestrutura));
        
        // Função auxiliar para converter qualquer valor para booleano e depois para 0 ou 1
        function convertToBit(value) {
          // Converter para booleano primeiro
          const boolValue = (
            value === true || 
            value === 'true' || 
            value === 1 || 
            value === '1' || 
            (typeof value === 'string' && value.toLowerCase() === 'sim') ||
            (typeof value === 'string' && value.toLowerCase() === 'yes')
          );
          
          // Converter o booleano para 0 ou 1
          return boolValue ? 1 : 0;
        }
        
        // Verificar se a infraestrutura é um objeto ou uma string JSON
        let infraObj = imovel.infraestrutura;
        if (typeof imovel.infraestrutura === 'string') {
          try {
            infraObj = JSON.parse(imovel.infraestrutura);
            console.log('Infraestrutura convertida de string JSON para objeto');
          } catch (e) {
            console.error('Erro ao analisar string JSON de infraestrutura:', e);
            // Manter o objeto original se não for um JSON válido
            infraObj = imovel.infraestrutura;
          }
        }
        
        // Converter valores para garantir que sejam números (0 ou 1)
        const agua = convertToBit(infraObj.agua);
        const esgoto = convertToBit(infraObj.esgoto);
        const energia = convertToBit(infraObj.energia);
        const pavimentacao = convertToBit(infraObj.pavimentacao);
        const iluminacao = convertToBit(infraObj.iluminacao);
        const coletaLixo = convertToBit(infraObj.coletaLixo);
        
        console.log('Valores convertidos para inserção:');
        console.log(`Água: ${agua}, Esgoto: ${esgoto}, Energia: ${energia}, Pavimentação: ${pavimentacao}, Iluminação: ${iluminacao}, Coleta de Lixo: ${coletaLixo}`);
        
        await pool.request().query(`
          INSERT INTO InfraestruturaImoveis (
            ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
          )
          VALUES (
            '${imovelId}',
            ${agua},
            ${esgoto},
            ${energia},
            ${pavimentacao},
            ${iluminacao},
            ${coletaLixo}
          )
        `);
      } else if (imovel.infraestrutura) {
        console.log('Tabela InfraestruturaImoveis não encontrada. Ignorando dados de infraestrutura.');
      }
    } catch (infraErr) {
      // Se houver erro ao cadastrar infraestrutura, apenas log, não interrompe o cadastro do imóvel
      console.error('Erro ao cadastrar infraestrutura (não crítico):', infraErr);
    }
    
    res.status(201).json({ id: imovelId });
  } catch (err) {
    console.error('Erro ao cadastrar imóvel:', err);
    console.error('Detalhes completos do erro:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    // Verificar se o erro é relacionado a violação de chave única
    if (err.message && (err.message.includes('Violation of PRIMARY KEY') || err.message.includes('UNIQUE KEY'))) {
      return res.status(400).json({ 
        error: 'Já existe um imóvel com essa matrícula ou identificação. Por favor, use outra matrícula.'
      });
    }
    
    // Verificar se o erro é relacionado a chave estrangeira
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ 
        error: 'Referência inválida. Verifique se o imóvel principal selecionado existe.'
      });
    }
    
    // Verificar se o erro é relacionado a conversão de dados ou overflow aritmético
    if (err.message && (err.message.includes('Converting') || err.message.includes('overflow') || err.message.includes('Arithmetic'))) {
      return res.status(400).json({ 
        error: 'Erro de conversão de dados. Alguns valores podem ser muito grandes para o banco de dados. Tente reduzir os valores numéricos.'
      });
    }
    
    // Erro genérico
    res.status(500).json({ 
      error: 'Erro ao cadastrar imóvel. Detalhes: ' + (err.message || 'Erro desconhecido')
    });
  }
});

// Rota para excluir um imóvel
app.delete('/api/imoveis/:id', async (req, res) => {
  try {
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    const { id } = req.params;
    const { cascade } = req.query; // Parâmetro para permitir exclusão em cascata
    
    // Verificar se o imóvel existe
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT COUNT(*) as count FROM Imoveis WHERE Id = @id');
    
    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ error: `Imóvel com ID ${id} não encontrado` });
    }
    
    // Verificar se o imóvel tem imóveis secundários
    const secundariosQuery = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT Id, Matricula, Objeto FROM Imoveis WHERE ImovelPaiId = @id');
    
    const imoveisSecundarios = secundariosQuery.recordset;
    
    // Se tem imóveis secundários e não é para excluir em cascata, retornar erro
    if (imoveisSecundarios.length > 0 && cascade !== 'true') {
      return res.status(400).json({ 
        error: `Não é possível excluir este imóvel porque ele possui ${imoveisSecundarios.length} imóveis secundários vinculados.`,
        secundarios: imoveisSecundarios
      });
    }
    
    // Se tem imóveis secundários e é para excluir em cascata, excluir os secundários primeiro
    if (imoveisSecundarios.length > 0 && cascade === 'true') {
      console.log(`Excluindo ${imoveisSecundarios.length} imóveis secundários vinculados ao imóvel ${id}`);
      
      // Excluir todos os registros relacionados dos imóveis secundários
      try {
        // Obter todas as tabelas que têm chaves estrangeiras para a tabela Imoveis
        const relatedTablesResult = await pool.request().query(`
          SELECT 
            fk.name AS ForeignKeyName,
            OBJECT_NAME(fk.parent_object_id) AS TableName,
            COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName
          FROM 
            sys.foreign_keys AS fk
            INNER JOIN sys.foreign_key_columns AS fkc ON fk.OBJECT_ID = fkc.constraint_object_id
            INNER JOIN sys.tables AS t ON t.OBJECT_ID = fk.referenced_object_id
          WHERE 
            OBJECT_NAME(fk.referenced_object_id) = 'Imoveis'
        `);
        
        // Registrar as tabelas relacionadas encontradas
        const relatedTables = relatedTablesResult.recordset;
        console.log('Tabelas relacionadas encontradas para secundários:', relatedTables.map(t => t.TableName));
        
        // Verificar tabelas específicas conhecidas (para compatibilidade)
        const knownTables = ['Infraestrutura', 'InfraestruturaImoveis', 'Documentos', 'DocumentosImoveis'];
        const tablesCheckResult = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME IN ('${knownTables.join("','")}') 
        `);
        
        const knownExistingTables = tablesCheckResult.recordset.map(r => r.TABLE_NAME);
        
        // Para cada imóvel secundário, excluir todos os registros relacionados
        for (const secundario of imoveisSecundarios) {
          // Excluir registros de cada tabela relacionada detectada pelo sistema
          for (const table of relatedTables) {
            await pool.request()
              .input('id', sql.UniqueIdentifier, secundario.Id)
              .query(`DELETE FROM [${table.TableName}] WHERE [${table.ColumnName}] = @id`);
            console.log(`Registros de ${table.TableName} do imóvel secundário com ID ${secundario.Id} excluídos`);
          }
          
          // Excluir de tabelas específicas que podem não ter sido detectadas pela consulta de chaves estrangeiras
          for (const tableName of knownExistingTables) {
            // Verificar se já foi excluído pela operação anterior
            if (!relatedTables.some(t => t.TableName === tableName)) {
              await pool.request()
                .input('id', sql.UniqueIdentifier, secundario.Id)
                .query(`DELETE FROM [${tableName}] WHERE ImovelId = @id`);
              console.log(`Registros de ${tableName} do imóvel secundário com ID ${secundario.Id} excluídos (verificação adicional)`);
            }
          }
          
          console.log(`Todos os registros relacionados do imóvel secundário com ID ${secundario.Id} foram excluídos`);
        }
      } catch (relatedErr) {
        console.error('Erro ao excluir registros relacionados dos imóveis secundários:', relatedErr);
        throw new Error(`Erro ao excluir registros relacionados dos imóveis secundários: ${relatedErr.message}`);
      }
      
      // Excluir imóveis secundários
      for (const secundario of imoveisSecundarios) {
        await pool.request()
          .input('id', sql.UniqueIdentifier, secundario.Id)
          .query('DELETE FROM Imoveis WHERE Id = @id');
        console.log(`Imóvel secundário com ID ${secundario.Id} excluído`);
      }
    }
    
    // Verificar e excluir registros relacionados de todas as tabelas dependentes
    try {
      // Obter todas as tabelas que têm chaves estrangeiras para a tabela Imoveis
      const relatedTablesResult = await pool.request().query(`
        SELECT 
          fk.name AS ForeignKeyName,
          OBJECT_NAME(fk.parent_object_id) AS TableName,
          COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName
        FROM 
          sys.foreign_keys AS fk
          INNER JOIN sys.foreign_key_columns AS fkc ON fk.OBJECT_ID = fkc.constraint_object_id
          INNER JOIN sys.tables AS t ON t.OBJECT_ID = fk.referenced_object_id
        WHERE 
          OBJECT_NAME(fk.referenced_object_id) = 'Imoveis'
      `);
      
      // Registrar as tabelas relacionadas encontradas
      const relatedTables = relatedTablesResult.recordset;
      console.log('Tabelas relacionadas encontradas:', relatedTables.map(t => t.TableName));
      
      // Excluir registros de cada tabela relacionada
      for (const table of relatedTables) {
        await pool.request()
          .input('id', sql.UniqueIdentifier, id)
          .query(`DELETE FROM [${table.TableName}] WHERE [${table.ColumnName}] = @id`);
        console.log(`Registros de ${table.TableName} do imóvel com ID ${id} excluídos`);
      }
      
      // Verificar tabelas específicas conhecidas (para compatibilidade)
      const knownTables = ['Infraestrutura', 'InfraestruturaImoveis', 'Documentos', 'DocumentosImoveis'];
      const tablesCheckResult = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME IN ('${knownTables.join("','")}') 
      `);
      
      const tables = tablesCheckResult.recordset.map(r => r.TABLE_NAME);
      console.log('Tabelas conhecidas encontradas:', tables);
      
      // Excluir de tabelas específicas que podem não ter sido detectadas pela consulta de chaves estrangeiras
      for (const tableName of tables) {
        // Verificar se já foi excluído pela operação anterior
        if (!relatedTables.some(t => t.TableName === tableName)) {
          await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query(`DELETE FROM [${tableName}] WHERE ImovelId = @id`);
          console.log(`Registros de ${tableName} do imóvel com ID ${id} excluídos (verificação adicional)`);
        }
      }
    } catch (relatedErr) {
      console.error('Erro ao excluir registros relacionados:', relatedErr);
      throw new Error(`Erro ao excluir registros relacionados do imóvel: ${relatedErr.message}`);
    }
    
    // Excluir o imóvel
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM Imoveis WHERE Id = @id');
    
    console.log(`Imóvel com ID ${id} excluído com sucesso`);
    
    res.status(200).json({ message: `Imóvel excluído com sucesso` });
  } catch (err) {
    console.error('Erro ao excluir imóvel:', err);
    console.error('Detalhes completos do erro:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    // Verificar se é um erro de chave estrangeira
    if (err.message && err.message.includes('REFERENCE constraint')) {
      return res.status(400).json({ 
        error: 'Não é possível excluir este imóvel porque ele está sendo referenciado por outros registros no sistema.' 
      });
    }
    
    res.status(500).json({ error: 'Erro ao excluir imóvel', details: err.message });
  }
});

// Rota para atualizar um imóvel
app.put('/api/imoveis/:id', async (req, res) => {
  try {
    console.log('Atualizando imóvel com ID:', req.params.id);
    console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
    await poolConnect; // Aguardar a conexão ser estabelecida
    
    const { id } = req.params;
    const imovel = req.body;
    
    // Verificar se o imóvel existe
    const checkResult = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT COUNT(*) as count FROM Imoveis WHERE Id = @id');
    
    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ error: `Imóvel com ID ${id} não encontrado` });
    }
    
    // Verificar se a matrícula já existe em outro imóvel
    if (imovel.matricula) {
      const duplicateCheck = await pool.request()
        .input('matricula', sql.VarChar, imovel.matricula)
        .input('id', sql.UniqueIdentifier, id)
        .query('SELECT COUNT(*) as count FROM Imoveis WHERE Matricula = @matricula AND Id != @id');
      
      if (duplicateCheck.recordset[0].count > 0) {
        return res.status(400).json({ 
          error: `A matrícula ${imovel.matricula} já está cadastrada em outro imóvel. Por favor, utilize outra matrícula.`
        });
      }
    }
    
    // Preparar os valores para atualização
    const area = toNumberOrZero(imovel.area);
    const valorVenal = toNumberOrZero(imovel.valorVenal);
    const latitude = imovel.latitude || 0;
    const longitude = imovel.longitude || 0;
    
    // Processar matrículas originadas (pode ser array ou string)
    let matriculasOriginadas = '';
    if (Array.isArray(imovel.matriculasOriginadas)) {
      matriculasOriginadas = imovel.matriculasOriginadas.join(',');
    } else if (typeof imovel.matriculasOriginadas === 'string') {
      matriculasOriginadas = imovel.matriculasOriginadas;
    }
    
    // Obter IDs das tabelas de referência
    let tipoImovelId = null, finalidadeId = null, statusTransferenciaId = null, tipoPosseId = null, tipoUsoEdificacaoId = null;
    
    // Buscar ID do tipo de imóvel
    if (imovel.tipoImovel) {
      const tipoImovelResult = await pool.request().query(`
        SELECT Id FROM TiposImovel WHERE Nome = '${imovel.tipoImovel}'
      `);
      tipoImovelId = tipoImovelResult.recordset.length > 0 ? parseInt(tipoImovelResult.recordset[0].Id) : null;
      console.log('TipoImovelId encontrado:', tipoImovelId, 'para nome:', imovel.tipoImovel);
    }
    
    // Buscar ID da finalidade
    if (imovel.finalidade) {
      const finalidadeResult = await pool.request().query(`
        SELECT Id FROM Finalidades WHERE Nome = '${imovel.finalidade}'
      `);
      finalidadeId = finalidadeResult.recordset.length > 0 ? parseInt(finalidadeResult.recordset[0].Id) : null;
      console.log('FinalidadeId encontrado:', finalidadeId, 'para nome:', imovel.finalidade);
    }
    
    // Buscar ID do status de transferência
    if (imovel.statusTransferencia) {
      const statusResult = await pool.request().query(`
        SELECT Id FROM StatusTransferencia WHERE Nome = '${imovel.statusTransferencia}'
      `);
      statusTransferenciaId = statusResult.recordset.length > 0 ? parseInt(statusResult.recordset[0].Id) : null;
      console.log('StatusTransferenciaId encontrado:', statusTransferenciaId, 'para nome:', imovel.statusTransferencia);
    }
    
    // Buscar ID do tipo de posse
    if (imovel.tipoPosse) {
      const tipoPosseResult = await pool.request().query(`
        SELECT Id FROM TiposPosse WHERE Nome = '${imovel.tipoPosse}'
      `);
      tipoPosseId = tipoPosseResult.recordset.length > 0 ? parseInt(tipoPosseResult.recordset[0].Id) : null;
      console.log('TipoPosseId encontrado:', tipoPosseId, 'para nome:', imovel.tipoPosse);
    }
    
    // Buscar ID do tipo de uso de edificação
    if (imovel.tipoUsoEdificacao) {
      const tipoUsoResult = await pool.request().query(`
        SELECT Id FROM TiposUsoEdificacao WHERE Nome = '${imovel.tipoUsoEdificacao}'
      `);
      tipoUsoEdificacaoId = tipoUsoResult.recordset.length > 0 ? parseInt(tipoUsoResult.recordset[0].Id) : null;
      console.log('TipoUsoEdificacaoId encontrado:', tipoUsoEdificacaoId, 'para nome:', imovel.tipoUsoEdificacao);
    }

    // Atualizar o imóvel na tabela principal
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('matricula', sql.VarChar, imovel.matricula || '')
      .input('localizacao', sql.VarChar, imovel.localizacao || '')
      .input('areaM2', sql.Decimal(18, 2), area)
      .input('objeto', sql.VarChar, imovel.objeto || '')
      .input('observacao', sql.VarChar, imovel.observacao || '')
      .input('finalidadeId', sql.Int, finalidadeId)
      .input('tipoImovelId', sql.Int, tipoImovelId)
      .input('statusTransferenciaId', sql.Int, statusTransferenciaId)
      .input('imovelPaiId', sql.UniqueIdentifier, imovel.imovelPaiId || null)
      .input('matriculasOriginadas', sql.VarChar, matriculasOriginadas)
      .input('registroIPTU', sql.VarChar, imovel.registroIPTU || '')
      .input('valorVenal', sql.Decimal(18, 2), valorVenal)
      .input('latitude', sql.Decimal(18, 6), latitude)
      .input('longitude', sql.Decimal(18, 6), longitude)
      .input('tipoUsoEdificacaoId', sql.Int, tipoUsoEdificacaoId)
      .input('tipoPosseId', sql.Int, tipoPosseId)
      .input('pontoReferencia', sql.VarChar, imovel.pontoReferencia || '')
      .query(`
        UPDATE Imoveis SET
          Matricula = @matricula,
          Localizacao = @localizacao,
          AreaM2 = @areaM2,
          Objeto = @objeto,
          Observacao = @observacao,
          FinalidadeId = @finalidadeId,
          TipoImovelId = @tipoImovelId,
          StatusTransferenciaId = @statusTransferenciaId,
          ImovelPaiId = @imovelPaiId,
          MatriculasOriginadas = @matriculasOriginadas,
          RegistroIPTU = @registroIPTU,
          ValorVenal = @valorVenal,
          Latitude = @latitude,
          Longitude = @longitude,
          TipoUsoEdificacaoId = @tipoUsoEdificacaoId,
          TipoPosseId = @tipoPosseId,
          PontoReferencia = @pontoReferencia,
          DataAtualizacao = GETDATE()
        WHERE Id = @id
      `);
    
    // Atualizar infraestrutura
    try {
      // Verificar se a tabela de infraestrutura existe
      const tableCheck = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'InfraestruturaImoveis'
      `);
      
      if (tableCheck.recordset[0].count > 0 && imovel.infraestrutura) {
        console.log('Atualizando infraestrutura para o imóvel:', id);
        console.log('Valores de infraestrutura recebidos:', JSON.stringify(imovel.infraestrutura));
        
        // Verificar se a infraestrutura é um objeto ou uma string JSON
        let infraObj = imovel.infraestrutura;
        if (typeof imovel.infraestrutura === 'string') {
          try {
            infraObj = JSON.parse(imovel.infraestrutura);
            console.log('Infraestrutura convertida de string JSON para objeto');
          } catch (e) {
            console.error('Erro ao analisar string JSON de infraestrutura:', e);
            infraObj = imovel.infraestrutura;
          }
        }
        
        // Converter valores para garantir que sejam números (0 ou 1)
        const agua = convertToBit(infraObj.agua);
        const esgoto = convertToBit(infraObj.esgoto);
        const energia = convertToBit(infraObj.energia);
        const pavimentacao = convertToBit(infraObj.pavimentacao);
        const iluminacao = convertToBit(infraObj.iluminacao);
        const coletaLixo = convertToBit(infraObj.coletaLixo);
        
        console.log('Valores convertidos para atualização:');
        console.log(`Água: ${agua}, Esgoto: ${esgoto}, Energia: ${energia}, Pavimentação: ${pavimentacao}, Iluminação: ${iluminacao}, Coleta de Lixo: ${coletaLixo}`);
        
        // Verificar se já existe um registro de infraestrutura para este imóvel
        const infraCheck = await pool.request()
          .input('id', sql.UniqueIdentifier, id)
          .query('SELECT COUNT(*) as count FROM InfraestruturaImoveis WHERE ImovelId = @id');
        
        if (infraCheck.recordset[0].count > 0) {
          // Atualizar registro existente
          await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('agua', sql.Bit, agua)
            .input('esgoto', sql.Bit, esgoto)
            .input('energia', sql.Bit, energia)
            .input('pavimentacao', sql.Bit, pavimentacao)
            .input('iluminacao', sql.Bit, iluminacao)
            .input('coletaLixo', sql.Bit, coletaLixo)
            .query(`
              UPDATE InfraestruturaImoveis SET
                Agua = @agua,
                Esgoto = @esgoto,
                Energia = @energia,
                Pavimentacao = @pavimentacao,
                Iluminacao = @iluminacao,
                ColetaLixo = @coletaLixo
              WHERE ImovelId = @id
            `);
        } else {
          // Inserir novo registro
          await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('agua', sql.Bit, agua)
            .input('esgoto', sql.Bit, esgoto)
            .input('energia', sql.Bit, energia)
            .input('pavimentacao', sql.Bit, pavimentacao)
            .input('iluminacao', sql.Bit, iluminacao)
            .input('coletaLixo', sql.Bit, coletaLixo)
            .query(`
              INSERT INTO InfraestruturaImoveis (
                ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
              )
              VALUES (
                @id, @agua, @esgoto, @energia, @pavimentacao, @iluminacao, @coletaLixo
              )
            `);
        }
      } else if (imovel.infraestrutura) {
        console.log('Tabela InfraestruturaImoveis não encontrada. Ignorando dados de infraestrutura.');
      }
    } catch (infraErr) {
      // Se houver erro ao atualizar infraestrutura, apenas log, não interrompe a atualização do imóvel
      console.error('Erro ao atualizar infraestrutura (não crítico):', infraErr);
    }
    
    res.json({ success: true, message: 'Imóvel atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar imóvel:', err);
    console.error('Detalhes completos do erro:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error('SQL processado:', err.procName, 'procedimento:', err.procedureName, 'linha:', err.lineNumber);
    
    // Verificar se o erro é relacionado a violação de chave única
    if (err.message && (err.message.includes('Violation of PRIMARY KEY') || err.message.includes('UNIQUE KEY'))) {
      return res.status(400).json({ 
        error: 'Já existe um imóvel com essa matrícula ou identificação. Por favor, use outra matrícula.'
      });
    }
    
    // Verificar se o erro é relacionado a chave estrangeira
    if (err.message && err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ 
        error: 'Referência inválida. Verifique se o imóvel principal selecionado existe.'
      });
    }
    
    // Verificar se o erro é relacionado a conversão de dados ou overflow aritmético
    if (err.message && (err.message.includes('Converting') || err.message.includes('overflow') || err.message.includes('Arithmetic'))) {
      return res.status(400).json({ 
        error: 'Erro de conversão de dados. Alguns valores podem ser muito grandes para o banco de dados. Tente reduzir os valores numéricos.'
      });
    }
    
    // Erro genérico
    res.status(500).json({ 
      error: 'Erro ao atualizar imóvel. Detalhes: ' + (err.message || 'Erro desconhecido')
    });
  }
});

// Configurar rotas de usuários
app.use('/api/usuarios', usuariosRoutes(pool, poolConnect));

// Configurar rotas de gerenciamento de documentos
app.use('/api/documentos', gerenciadorDocumentosRoutes(pool, poolConnect));

// Configurar rotas de seleção de arquivos
app.use('/api/seletor-arquivos', seletorArquivosRoutes);

// Configurar rotas de documentos
app.use('/api/documentos', documentosRoutes(pool, poolConnect));

// Configurar rotas para abrir arquivos
app.use('/api/arquivo', abrirArquivoRoutes);

// Função para converter valores booleanos ou string para bits (0 ou 1)
function convertToBit(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value > 0 ? 1 : 0;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'sim' || lowerValue === 's' || lowerValue === 'yes' || lowerValue === 'y' ? 1 : 0;
  }
  return 0;
}

// Função para verificar e criar a coluna UsuarioCadastroNome se não existir
async function verificarECriarColunaUsuario() {
  try {
    await poolConnect;
    
    // Verificar se a coluna UsuarioCadastroNome existe
    const colunaExiste = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Imoveis'
      AND COLUMN_NAME = 'UsuarioCadastroNome'
    `);
    
    // Se a coluna não existir, criar
    if (colunaExiste.recordset[0].count === 0) {
      console.log('Coluna UsuarioCadastroNome não encontrada. Criando...');
      await pool.request().query(`
        ALTER TABLE Imoveis
        ADD UsuarioCadastroNome NVARCHAR(255) NULL
      `);
      console.log('Coluna UsuarioCadastroNome criada com sucesso!');
    } else {
      console.log('Coluna UsuarioCadastroNome já existe.');
    }
  } catch (err) {
    console.error('Erro ao verificar/criar coluna UsuarioCadastroNome:', err);
  }
}

// Iniciar o servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await testDatabaseConnection();
  await verificarECriarColunaUsuario();
  console.log('Servidor pronto para receber requisições!');
});
