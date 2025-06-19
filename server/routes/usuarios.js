import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-do-sistema-cehop';

// Middleware para verificar autenticação
const authMiddleware = (req, res, next) => {
  // Verificar primeiro no cabeçalho Authorization (formato Bearer token)
  const authHeader = req.headers.authorization;
  let token;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Verificar no cabeçalho x-auth-token para compatibilidade
    token = req.header('x-auth-token');
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    console.error('Erro ao verificar token no middleware:', err.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar se é administrador
const adminMiddleware = (req, res, next) => {
  // O cargo de Administrador pode ser identificado pelo UUID 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF'
  // ou pelo número 1, dependendo de como foi configurado no banco de dados
  const adminCargoId = 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF';
  
  if (!req.usuario || (req.usuario.cargoId !== 1 && req.usuario.cargoId !== adminCargoId)) {
    return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
  }
  next();
};

// Função para sanitizar strings SQL
function sanitizeSqlString(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''");
}

export default function(pool, poolConnect) {
  // Rota para verificar a validade do token JWT
  router.get('/verificar-token', (req, res) => {
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

  // Rota para login
  router.post('/login', async (req, res) => {
    try {
      await poolConnect;
      const { nomeUsuario, senha } = req.body;
      
      if (!nomeUsuario || !senha) {
        return res.status(400).json({ error: 'Por favor, forneça nome de usuário e senha.' });
      }
      
      const result = await pool.request().query(`
        SELECT 
          u.Id, 
          u.Nome, 
          u.NomeUsuario, 
          u.Senha, 
          u.Ativo,
          u.CargoId,
          c.Nome as Cargo
        FROM 
          Usuarios u
        JOIN 
          Cargos c ON u.CargoId = c.Id
        WHERE 
          u.NomeUsuario = '${sanitizeSqlString(nomeUsuario)}'
      `);
      
      if (result.recordset.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }
      
      const usuario = result.recordset[0];
      
      // Verificar se o usuário está ativo
      if (!usuario.Ativo) {
        return res.status(401).json({ error: 'Usuário desativado. Entre em contato com o administrador.' });
      }
      
      // Na versão atual, comparamos a senha diretamente
      // Em produção, usaríamos bcrypt.compare
      if (usuario.Senha !== senha) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }
      
      // Atualizar último login
      await pool.request().query(`
        UPDATE Usuarios
        SET UltimoLogin = GETDATE()
        WHERE Id = '${usuario.Id}'
      `);
      
      // Gerar token JWT - sem expiração definida (sessão permanente)
      const token = jwt.sign(
        { 
          id: usuario.Id, 
          nome: usuario.Nome,
          nomeUsuario: usuario.NomeUsuario,
          cargoId: usuario.CargoId || 2 // Assume 2 como usuário normal se não tiver CargoId
        }, 
        JWT_SECRET
        // Parâmetro expiresIn removido - token nunca expirará
      );
      
      // Retornar dados do usuário e token
      console.log('Usuário logado:', {
        id: usuario.Id,
        nome: usuario.Nome,
        nomeUsuario: usuario.NomeUsuario,
        cargoId: usuario.CargoId,
        ativo: usuario.Ativo
      });
      
      res.json({
        usuario: {
          id: usuario.Id,
          nome: usuario.Nome,
          nomeUsuario: usuario.NomeUsuario,
          cargoId: usuario.CargoId,
          ativo: usuario.Ativo
        },
        token
      });
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      res.status(500).json({ error: 'Erro ao processar o login.' });
    }
  });
  
  // Rota para listar todos os usuários (apenas admin)
  router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await poolConnect;
      
      const result = await pool.request().query(`
        SELECT 
          u.Id, 
          u.Nome, 
          u.NomeUsuario, 
          u.Ativo,
          u.DataCriacao,
          u.DataAtualizacao,
          u.UltimoLogin,
          u.CargoId,
          c.Nome as Cargo
        FROM 
          Usuarios u
        JOIN 
          Cargos c ON u.CargoId = c.Id
        ORDER BY 
          u.Nome
      `);
      
      const usuarios = result.recordset.map(u => ({
        id: u.Id,
        nome: u.Nome,
        nomeUsuario: u.NomeUsuario,
        cargoId: u.CargoId,
        cargo: u.Cargo,
        ativo: u.Ativo,
        dataCriacao: u.DataCriacao,
        dataAtualizacao: u.DataAtualizacao,
        ultimoLogin: u.UltimoLogin
      }));
      
      res.json(usuarios);
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  });
  
  // Rota para obter usuário por ID (apenas admin ou o próprio usuário)
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      await poolConnect;
      const { id } = req.params;
      
      // Verificar permissão: deve ser admin ou o próprio usuário
      if (req.usuario.cargo !== 'Administrador' && req.usuario.id !== id) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }
      
      const result = await pool.request().query(`
        SELECT 
          u.Id, 
          u.Nome, 
          u.NomeUsuario, 
          u.Ativo,
          u.DataCriacao,
          u.DataAtualizacao,
          u.UltimoLogin,
          c.Nome as Cargo
        FROM 
          Usuarios u
        JOIN 
          Cargos c ON u.CargoId = c.Id
        WHERE 
          u.Id = '${sanitizeSqlString(id)}'
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      
      const u = result.recordset[0];
      const usuario = {
        id: u.Id,
        nome: u.Nome,
        nomeUsuario: u.NomeUsuario,
        cargo: u.Cargo,
        ativo: u.Ativo,
        dataCriacao: u.DataCriacao,
        dataAtualizacao: u.DataAtualizacao,
        ultimoLogin: u.UltimoLogin
      };
      
      res.json(usuario);
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
  });
  
  // Rota para criar novo usuário (apenas admin)
  router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await poolConnect;
      const { nome, nomeUsuario, senha, cargo, ativo = true } = req.body;
      
      // Validar dados
      if (!nome || !nomeUsuario || !senha || !cargo) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      }
      
      // Verificar se o nome de usuário já existe
      const checkUsuario = await pool.request().query(`
        SELECT COUNT(*) as count FROM Usuarios WHERE NomeUsuario = '${sanitizeSqlString(nomeUsuario)}'
      `);
      
      if (checkUsuario.recordset[0].count > 0) {
        return res.status(400).json({ error: 'Nome de usuário já existe.' });
      }
      
      // Buscar ID do cargo
      const cargoResult = await pool.request().query(`
        SELECT Id FROM Cargos WHERE Nome = '${sanitizeSqlString(cargo)}'
      `);
      
      if (cargoResult.recordset.length === 0) {
        return res.status(400).json({ error: 'Cargo inválido.' });
      }
      
      const cargoId = cargoResult.recordset[0].Id;
      const usuarioId = uuidv4();
      
      // Em produção, usaríamos bcrypt para hash da senha
      // const hashedSenha = await bcrypt.hash(senha, 10);
      const hashedSenha = senha; // Temporário
      
      // Inserir usuário
      await pool.request().query(`
        INSERT INTO Usuarios (
          Id, Nome, NomeUsuario, Senha, CargoId, Ativo, DataCriacao, DataAtualizacao
        ) VALUES (
          '${usuarioId}',
          '${sanitizeSqlString(nome)}',
          '${sanitizeSqlString(nomeUsuario)}',
          '${sanitizeSqlString(hashedSenha)}',
          '${cargoId}',
          ${ativo ? 1 : 0},
          GETDATE(),
          GETDATE()
        )
      `);
      
      res.status(201).json({
        id: usuarioId,
        nome,
        nomeUsuario,
        cargo,
        ativo,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        ultimoLogin: null
      });
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
  });
  
  // Rota para atualizar usuário (apenas admin)
  router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await poolConnect;
      const { id } = req.params;
      const { nome, nomeUsuario, senha, cargo, ativo } = req.body;
      
      // Verificar se o usuário existe
      const checkUsuario = await pool.request().query(`
        SELECT COUNT(*) as count FROM Usuarios WHERE Id = '${sanitizeSqlString(id)}'
      `);
      
      if (checkUsuario.recordset[0].count === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      
      // Verificar se o nome de usuário já existe (para outro usuário)
      if (nomeUsuario) {
        const checkNomeUsuario = await pool.request().query(`
          SELECT COUNT(*) as count FROM Usuarios 
          WHERE NomeUsuario = '${sanitizeSqlString(nomeUsuario)}' AND Id != '${sanitizeSqlString(id)}'
        `);
        
        if (checkNomeUsuario.recordset[0].count > 0) {
          return res.status(400).json({ error: 'Nome de usuário já existe.' });
        }
      }
      
      // Buscar ID do cargo se fornecido
      let cargoId = null;
      if (cargo) {
        const cargoResult = await pool.request().query(`
          SELECT Id FROM Cargos WHERE Nome = '${sanitizeSqlString(cargo)}'
        `);
        
        if (cargoResult.recordset.length === 0) {
          return res.status(400).json({ error: 'Cargo inválido.' });
        }
        
        cargoId = cargoResult.recordset[0].Id;
      }
      
      // Construir a query de atualização
      let updateQuery = `
        UPDATE Usuarios
        SET DataAtualizacao = GETDATE()
      `;
      
      if (nome) {
        updateQuery += `, Nome = '${sanitizeSqlString(nome)}'`;
      }
      
      if (nomeUsuario) {
        updateQuery += `, NomeUsuario = '${sanitizeSqlString(nomeUsuario)}'`;
      }
      
      if (senha) {
        // Em produção, usaríamos bcrypt para hash da senha
        // const hashedSenha = await bcrypt.hash(senha, 10);
        const hashedSenha = senha; // Temporário
        updateQuery += `, Senha = '${sanitizeSqlString(hashedSenha)}'`;
      }
      
      if (cargoId) {
        updateQuery += `, CargoId = '${cargoId}'`;
      }
      
      if (ativo !== undefined) {
        updateQuery += `, Ativo = ${ativo ? 1 : 0}`;
      }
      
      updateQuery += ` WHERE Id = '${sanitizeSqlString(id)}'`;
      
      // Executar a atualização
      await pool.request().query(updateQuery);
      
      // Buscar usuário atualizado
      const result = await pool.request().query(`
        SELECT 
          u.Id, 
          u.Nome, 
          u.NomeUsuario, 
          u.Ativo,
          u.DataCriacao,
          u.DataAtualizacao,
          u.UltimoLogin,
          c.Nome as Cargo
        FROM 
          Usuarios u
        JOIN 
          Cargos c ON u.CargoId = c.Id
        WHERE 
          u.Id = '${sanitizeSqlString(id)}'
      `);
      
      const u = result.recordset[0];
      const usuario = {
        id: u.Id,
        nome: u.Nome,
        nomeUsuario: u.NomeUsuario,
        cargo: u.Cargo,
        ativo: u.Ativo,
        dataCriacao: u.DataCriacao,
        dataAtualizacao: u.DataAtualizacao,
        ultimoLogin: u.UltimoLogin
      };
      
      res.json(usuario);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
  });
  
  // Rota para excluir usuário (apenas admin)
  router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await poolConnect;
      const { id } = req.params;
      
      // Verificar se o usuário existe
      const checkUsuario = await pool.request().query(`
        SELECT COUNT(*) as count FROM Usuarios WHERE Id = '${sanitizeSqlString(id)}'
      `);
      
      if (checkUsuario.recordset[0].count === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      
      // Verificar se não é o último administrador
      const checkAdmin = await pool.request().query(`
        SELECT u.Id, c.Nome as Cargo
        FROM Usuarios u
        JOIN Cargos c ON u.CargoId = c.Id
        WHERE c.Nome = 'Administrador' AND u.Ativo = 1
      `);
      
      if (checkAdmin.recordset.length === 1 && checkAdmin.recordset[0].Id === id) {
        return res.status(400).json({ error: 'Não é possível excluir o último administrador ativo.' });
      }
      
      // Excluir usuário
      await pool.request().query(`
        DELETE FROM Usuarios WHERE Id = '${sanitizeSqlString(id)}'
      `);
      
      res.json({ message: 'Usuário excluído com sucesso.' });
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
  });
  
  // Rota para listar cargos
  router.get('/cargos/listar', authMiddleware, async (req, res) => {
    try {
      await poolConnect;
      
      const result = await pool.request().query(`
        SELECT Id, Nome, Descricao
        FROM Cargos
        ORDER BY Nome
      `);
      
      const cargos = result.recordset.map(c => ({
        id: c.Id,
        nome: c.Nome,
        descricao: c.Descricao
      }));
      
      res.json(cargos);
    } catch (err) {
      console.error('Erro ao listar cargos:', err);
      res.status(500).json({ error: 'Erro ao buscar cargos.' });
    }
  });
  
  return router;
};
