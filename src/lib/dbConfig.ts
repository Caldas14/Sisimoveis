// Configuração da conexão com o banco de dados SQL Server
export const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'SistemaCadastroImoveis',
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true
  }
};

console.log('Configuração do banco de dados:', {
  ...dbConfig,
  password: '******' // Ocultar senha por segurança
});
