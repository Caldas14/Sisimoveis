import express from 'express';

const router = express.Router();

export default function(pool, poolConnect) {
  // Rota para obter valores personalizados de uma determinada categoria
  router.get('/:categoria', async (req, res) => {
    try {
      await poolConnect;
      const { categoria } = req.params;
      
      // Validar a categoria para evitar injeção SQL
      const categoriasValidas = ['Finalidade', 'TipoImovel', 'TipoUsoEdificacao', 'TipoPosse', 'StatusTransferencia'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
      
      // Buscar valores personalizados da categoria
      const result = await pool.request().query(`
        SELECT Id, Valor, DataCriacao, UsuarioCriacao
        FROM ValoresPersonalizados
        WHERE Categoria = '${categoria}'
        ORDER BY Valor
      `);
      
      res.json(result.recordset);
    } catch (err) {
      console.error(`Erro ao buscar valores personalizados para ${req.params.categoria}:`, err);
      res.status(500).json({ error: 'Erro ao buscar valores personalizados: ' + err.message });
    }
  });
  
  // Rota para adicionar um novo valor personalizado
  router.post('/', async (req, res) => {
    try {
      await poolConnect;
      const { categoria, valor, usuarioCriacao } = req.body;
      
      // Validar a categoria para evitar injeção SQL
      const categoriasValidas = ['Finalidade', 'TipoImovel', 'TipoUsoEdificacao', 'TipoPosse', 'StatusTransferencia'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ error: 'Categoria inválida' });
      }
      
      // Verificar se o valor já existe para esta categoria (case insensitive)
      const checkResult = await pool.request().query(`
        SELECT COUNT(*) as count
        FROM ValoresPersonalizados
        WHERE Categoria = '${categoria}' AND LOWER(Valor) = LOWER('${valor.replace(/'/g, "''")}')
      `);
      
      if (checkResult.recordset[0].count > 0) {
        return res.status(400).json({ error: 'Este valor já existe para esta categoria' });
      }
      
      // Inserir o novo valor personalizado
      const result = await pool.request().query(`
        INSERT INTO ValoresPersonalizados (Categoria, Valor, UsuarioCriacao)
        VALUES ('${categoria}', '${valor.replace(/'/g, "''")}', '${usuarioCriacao || "Sistema"}')
        
        SELECT SCOPE_IDENTITY() as Id
      `);
      
      res.status(201).json({ 
        message: 'Valor personalizado adicionado com sucesso',
        valor: valor,
        categoria: categoria
      });
    } catch (err) {
      console.error('Erro ao adicionar valor personalizado:', err);
      res.status(500).json({ error: 'Erro ao adicionar valor personalizado: ' + err.message });
    }
  });
  
  // Rota para excluir um valor personalizado
  router.delete('/:id', async (req, res) => {
    try {
      await poolConnect;
      const { id } = req.params;
      
      // Excluir o valor personalizado
      const result = await pool.request().query(`
        DELETE FROM ValoresPersonalizados
        WHERE Id = '${id}'
      `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Valor personalizado não encontrado' });
      }
      
      res.json({ success: true, message: 'Valor personalizado excluído com sucesso' });
    } catch (err) {
      console.error(`Erro ao excluir valor personalizado ${req.params.id}:`, err);
      res.status(500).json({ error: 'Erro ao excluir valor personalizado: ' + err.message });
    }
  });
  
  // Retornar o router configurado
  return router;
}
