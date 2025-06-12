-- Script para criar a tabela de usuários
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cargos')
BEGIN
    CREATE TABLE Cargos (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Nome NVARCHAR(50) NOT NULL,
        Descricao NVARCHAR(255) NULL,
        DataCriacao DATETIME DEFAULT GETDATE(),
        DataAtualizacao DATETIME DEFAULT GETDATE()
    );

    -- Inserir cargos padrão
    INSERT INTO Cargos (Nome, Descricao) VALUES 
    ('Administrador', 'Acesso total ao sistema'),
    ('Usuário', 'Acesso limitado ao sistema');
END;

-- Criar tabela de usuários se não existir
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Nome NVARCHAR(100) NOT NULL,
        NomeUsuario NVARCHAR(50) NOT NULL UNIQUE,
        Senha NVARCHAR(255) NOT NULL, -- Armazenaremos a senha com hash
        CargoId UNIQUEIDENTIFIER NOT NULL,
        Ativo BIT DEFAULT 1,
        DataCriacao DATETIME DEFAULT GETDATE(),
        DataAtualizacao DATETIME DEFAULT GETDATE(),
        UltimoLogin DATETIME NULL,
        FOREIGN KEY (CargoId) REFERENCES Cargos(Id)
    );

    -- Criar um usuário administrador padrão
    -- Senha: admin123 (na implementação real, usaremos hash)
    INSERT INTO Usuarios (Nome, NomeUsuario, Senha, CargoId)
    SELECT 'Administrador', 'admin', 'admin123', Id
    FROM Cargos
    WHERE Nome = 'Administrador';
END;
