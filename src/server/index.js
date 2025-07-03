// Servidor principal da aplicação
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

// Importar rotas
const usuarioRoutes = require('./routes/usuarioRoutes');

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
}

// Registrar rotas
app.use('/api/usuarios', usuarioRoutes);

// Rota padrão para o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
