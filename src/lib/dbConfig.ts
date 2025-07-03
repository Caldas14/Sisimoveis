// Configuração da conexão com o banco de dados SQL Server
export const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true
  }
};

console.log('Configuração do banco de dados:', {
  ...dbConfig,
  password: '******' // Ocultar senha por segurança
});
