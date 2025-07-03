-- Script para recriar a tabela de usuários no SQL Server com a coluna de preferência de tema

-- Verificar se a tabela existe e excluí-la
IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL
    DROP TABLE dbo.Usuarios;
GO

-- Criar a tabela de usuários
CREATE TABLE dbo.Usuarios (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Nome NVARCHAR(100) NOT NULL,
    NomeUsuario NVARCHAR(50) NOT NULL UNIQUE,
    Senha NVARCHAR(255) NOT NULL,
    CargoId UNIQUEIDENTIFIER NOT NULL,
    Ativo BIT NOT NULL DEFAULT 1,
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NULL,
    UltimoLogin DATETIME2 NULL,
    PreferenciaModoEscuro BIT NULL -- TRUE para modo escuro, FALSE para modo claro, NULL para usar a preferência do sistema
);
GO

-- Criar índice para melhorar a performance de consultas que utilizam a coluna de preferência de tema
CREATE INDEX idx_usuarios_tema ON dbo.Usuarios(PreferenciaModoEscuro);
GO

-- Adicionar descrição à coluna de preferência de tema
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Preferência de tema do usuário: 1 para modo escuro, 0 para modo claro, NULL para usar a preferência do sistema',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Usuarios',
    @level2type = N'COLUMN', @level2name = N'PreferenciaModoEscuro';
GO

-- Inserir alguns usuários de exemplo (opcional)
INSERT INTO dbo.Usuarios (Id, Nome, NomeUsuario, Senha, CargoId, Ativo)
VALUES 
    ('F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF', 'Administrador', 'admin', '123', 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF', 1),
    ('FDDCDA5-78D9-4D1F-A54B-9A26E6FE7BFB', 'Caldas', 'Caldas', '1412', 'F6B3EB7F-55F1-4B4B-A290-9AA59A4800FF', 1);
GO
