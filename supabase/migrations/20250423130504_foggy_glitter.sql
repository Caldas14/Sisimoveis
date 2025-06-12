/*
# Esquema de Banco de Dados para o Sistema de Cadastro de Imóveis

1. Tabelas Principais
   - `TiposImovel` - Tipos de imóveis disponíveis
   - `StatusTransferencia` - Estados possíveis de transferência
   - `Finalidades` - Finalidades possíveis dos imóveis
   - `Imoveis` - Cadastro principal de imóveis
   - `Documentos` - Documentos anexados aos imóveis

2. Segurança
   - `Usuarios` - Usuários do sistema
   - `Perfis` - Perfis de acesso
   - `UsuariosPerfis` - Relação entre usuários e perfis
   - `Logs` - Registro de atividades

3. Relações e Constraints
   - Chaves estrangeiras para garantir integridade referencial
   - Índices para campos frequentemente consultados
   - Constraints para garantir dados válidos
*/

-- Criar o banco de dados se não existir
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SistemaCadastroImoveis')
BEGIN
    CREATE DATABASE SistemaCadastroImoveis;
    PRINT 'Banco de dados SistemaCadastroImoveis criado com sucesso.';
END
ELSE
BEGIN
    PRINT 'Banco de dados SistemaCadastroImoveis já existe.';
END
GO

-- Usar o banco de dados criado
USE SistemaCadastroImoveis;
GO

-- Remover objetos existentes se necessário
IF OBJECT_ID('MatriculasOriginadas', 'U') IS NOT NULL
    DROP TABLE MatriculasOriginadas;

IF OBJECT_ID('Documentos', 'U') IS NOT NULL
    DROP TABLE Documentos;

IF OBJECT_ID('Imoveis', 'U') IS NOT NULL
    DROP TABLE Imoveis;

IF OBJECT_ID('TiposImovel', 'U') IS NOT NULL
    DROP TABLE TiposImovel;

IF OBJECT_ID('Finalidades', 'U') IS NOT NULL
    DROP TABLE Finalidades;

IF OBJECT_ID('StatusTransferencia', 'U') IS NOT NULL
    DROP TABLE StatusTransferencia;

IF OBJECT_ID('Logs', 'U') IS NOT NULL
    DROP TABLE Logs;

IF OBJECT_ID('Usuarios', 'U') IS NOT NULL
    DROP TABLE Usuarios;

IF OBJECT_ID('Perfis', 'U') IS NOT NULL
    DROP TABLE Perfis;

IF OBJECT_ID('UsuariosPerfis', 'U') IS NOT NULL
    DROP TABLE UsuariosPerfis;

IF OBJECT_ID('trg_AtualizarDataAtualizacao_Imoveis', 'TR') IS NOT NULL
    DROP TRIGGER trg_AtualizarDataAtualizacao_Imoveis;

IF OBJECT_ID('sp_RegistrarLog', 'P') IS NOT NULL
    DROP PROCEDURE sp_RegistrarLog;

-- Criação das tabelas de domínio (lookup tables)
CREATE TABLE TiposImovel (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(50) NOT NULL UNIQUE,
    Descricao NVARCHAR(255),
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE StatusTransferencia (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(50) NOT NULL UNIQUE,
    Descricao NVARCHAR(255),
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Finalidades (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(50) NOT NULL UNIQUE,
    Descricao NVARCHAR(255),
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Tabela principal de imóveis
CREATE TABLE Imoveis (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Matricula NVARCHAR(100) NOT NULL UNIQUE,
    Localizacao NVARCHAR(255) NOT NULL,
    AreaM2 DECIMAL(18,2) NOT NULL,
    Objeto NVARCHAR(255) NOT NULL,
    Observacao NVARCHAR(MAX),
    TipoImovelId INT NOT NULL FOREIGN KEY REFERENCES TiposImovel(Id),
    FinalidadeId INT NOT NULL FOREIGN KEY REFERENCES Finalidades(Id),
    StatusTransferenciaId INT NOT NULL FOREIGN KEY REFERENCES StatusTransferencia(Id),
    ImovelPaiId UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES Imoveis(Id),
    DataCadastro DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    UsuarioCadastroId UNIQUEIDENTIFIER NOT NULL,
    UsuarioAtualizacaoId UNIQUEIDENTIFIER NOT NULL
);

-- Índice para busca por matrícula (frequentemente utilizado)
CREATE INDEX IX_Imoveis_Matricula ON Imoveis(Matricula);

-- Índice para busca por imóvel pai (para listar secundários de um principal)
CREATE INDEX IX_Imoveis_ImovelPai ON Imoveis(ImovelPaiId);

-- Tabela para armazenar as matrículas originadas
CREATE TABLE MatriculasOriginadas (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ImovelId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Imoveis(Id),
    Matricula NVARCHAR(100) NOT NULL,
    Observacao NVARCHAR(255),
    DataCadastro DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Tabela para documentos anexados
CREATE TABLE Documentos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ImovelId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Imoveis(Id),
    Nome NVARCHAR(255) NOT NULL,
    CaminhoArquivo NVARCHAR(1000) NOT NULL,
    TipoArquivo NVARCHAR(100) NOT NULL,
    Tamanho BIGINT NOT NULL,
    DataUpload DATETIME2 NOT NULL DEFAULT GETDATE(),
    UsuarioUploadId UNIQUEIDENTIFIER NOT NULL
);

-- Índice para busca de documentos por imóvel
CREATE INDEX IX_Documentos_ImovelId ON Documentos(ImovelId);

-- Tabelas para segurança e auditoria
CREATE TABLE Usuarios (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Senha NVARCHAR(255) NOT NULL,
    Ativo BIT NOT NULL DEFAULT 1,
    UltimoAcesso DATETIME2 NULL,
    DataCadastro DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Perfis (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(50) NOT NULL UNIQUE,
    Descricao NVARCHAR(255),
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE UsuariosPerfis (
    UsuarioId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    PerfilId INT NOT NULL FOREIGN KEY REFERENCES Perfis(Id),
    DataAtribuicao DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (UsuarioId, PerfilId)
);

CREATE TABLE Logs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UsuarioId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    Acao NVARCHAR(100) NOT NULL,
    Tabela NVARCHAR(100) NOT NULL,
    Registro NVARCHAR(36) NOT NULL,
    Detalhes NVARCHAR(MAX),
    DataHora DATETIME2 NOT NULL DEFAULT GETDATE(),
    Endereco NVARCHAR(50) -- IP do usuário
);

-- Criar índice para busca de logs por usuário
CREATE INDEX IX_Logs_UsuarioId ON Logs(UsuarioId);

-- Criar índice para busca de logs por data
CREATE INDEX IX_Logs_DataHora ON Logs(DataHora);

-- Inserir dados iniciais
-- Tipos de imóvel
INSERT INTO TiposImovel (Nome, Descricao) VALUES
('Residencial', 'Imóveis para fins de habitação'),
('Comercial', 'Imóveis para fins comerciais'),
('Industrial', 'Imóveis para fins industriais'),
('Rural', 'Imóveis rurais'),
('Terreno', 'Terrenos sem edificações'),
('Outros', 'Outros tipos de imóveis');

-- Status de transferência
INSERT INTO StatusTransferencia (Nome, Descricao) VALUES
('Não transferido', 'Imóvel não transferido'),
('Em processo', 'Transferência em andamento'),
('Transferido', 'Imóvel já transferido'),
('Cancelado', 'Processo de transferência cancelado');

-- Finalidades
INSERT INTO Finalidades (Nome, Descricao) VALUES
('Habitação', 'Para fins de moradia'),
('Comércio', 'Para estabelecimentos comerciais'),
('Indústria', 'Para estabelecimentos industriais'),
('Agricultura', 'Para atividades agrícolas'),
('Serviços', 'Para prestação de serviços'),
('Misto', 'Imóvel com múltiplas finalidades'),
('Outros', 'Outras finalidades');

-- Perfis de usuário
INSERT INTO Perfis (Nome, Descricao) VALUES
('Administrador', 'Acesso total ao sistema'),
('Editor', 'Pode cadastrar e editar imóveis'),
('Visualizador', 'Apenas visualização dos dados');

-- Criar usuário admin (senha: admin123)
INSERT INTO Usuarios (Id, Nome, Email, Senha)
VALUES (NEWID(), 'Admin Usuário', 'admin@sistema.com', 'hashed_password_here');

-- Atribuir perfil administrador ao usuário admin
INSERT INTO UsuariosPerfis (UsuarioId, PerfilId)
SELECT (SELECT Id FROM Usuarios WHERE Email = 'admin@sistema.com'), 
       (SELECT Id FROM Perfis WHERE Nome = 'Administrador');

-- Triggers para auditoria e atualização de datas
GO
CREATE TRIGGER trg_AtualizarDataAtualizacao_Imoveis
ON Imoveis
AFTER UPDATE
AS
BEGIN
    UPDATE i
    SET DataAtualizacao = GETDATE()
    FROM Imoveis i
    INNER JOIN inserted ins ON i.Id = ins.Id;
END;

-- Stored procedure para registrar logs de operações
GO
CREATE PROCEDURE sp_RegistrarLog
    @UsuarioId UNIQUEIDENTIFIER,
    @Acao NVARCHAR(100),
    @Tabela NVARCHAR(100),
    @Registro NVARCHAR(36),
    @Detalhes NVARCHAR(MAX) = NULL,
    @Endereco NVARCHAR(50) = NULL
AS
BEGIN
    INSERT INTO Logs (UsuarioId, Acao, Tabela, Registro, Detalhes, Endereco)
    VALUES (@UsuarioId, @Acao, @Tabela, @Registro, @Detalhes, @Endereco);
END;
GO