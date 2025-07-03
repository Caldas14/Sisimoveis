// Rotas para gerenciamento de usuários
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Middleware para verificar autenticação
router.use(auth);

/**
 * Atualiza a preferência de tema do usuário
 * @route PUT /api/usuarios/:id/tema
 * @param {string} id - ID do usuário
 * @param {Object} body - Corpo da requisição
 * @param {boolean|null} body.preferenciaModoEscuro - Preferência de tema (true=escuro, false=claro, null=sistema)
 * @returns {Object} Mensagem de sucesso
 */
router.put('/:id/tema', async (req, res) => {
  try {
    const { id } = req.params;
    const { preferenciaModoEscuro } = req.body;
    
    // Verificar se o usuário está tentando atualizar seu próprio perfil
    if (req.usuario.id !== id && req.usuario.cargo !== 'Administrador') {
      return res.status(403).json({ 
        mensagem: 'Você não tem permissão para atualizar a preferência de tema de outro usuário' 
      });
    }
    
    // Validar o valor da preferência
    if (preferenciaModoEscuro !== true && preferenciaModoEscuro !== false && preferenciaModoEscuro !== null) {
      return res.status(400).json({ 
        mensagem: 'Valor inválido para preferenciaModoEscuro. Deve ser true, false ou null' 
      });
    }
    
    // Atualizar a preferência no banco de dados
    const query = `
      UPDATE Usuarios 
      SET PreferenciaModoEscuro = $1 
      WHERE id = $2
      RETURNING id, nome, PreferenciaModoEscuro
    `;
    
    const result = await db.query(query, [preferenciaModoEscuro, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }
    
    return res.status(200).json({
      mensagem: 'Preferência de tema atualizada com sucesso',
      usuario: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao atualizar preferência de tema:', error);
    return res.status(500).json({ 
      mensagem: 'Erro ao atualizar preferência de tema',
      erro: error.message 
    });
  }
});

module.exports = router;
