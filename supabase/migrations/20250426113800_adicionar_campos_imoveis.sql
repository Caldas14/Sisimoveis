/*
Script de migração para adicionar campos faltantes à tabela Imoveis.

Este script adiciona os campos que estão presentes na interface Imovel do frontend,
mas que não foram incluídos na migração inicial do banco de dados em
20250423130504_foggy_glitter.sql.
*/

-- Usar o banco de dados criado
USE SistemaCadastroImoveis;
GO

-- Remover procedimentos armazenados e funções existentes
IF OBJECT_ID('sp_AtualizarInfraestrutura', 'P') IS NOT NULL
    DROP PROCEDURE sp_AtualizarInfraestrutura;

IF OBJECT_ID('fn_GetTipoImovelId', 'FN') IS NOT NULL
    DROP FUNCTION fn_GetTipoImovelId;

IF OBJECT_ID('fn_GetFinalidadeId', 'FN') IS NOT NULL
    DROP FUNCTION fn_GetFinalidadeId;

IF OBJECT_ID('fn_GetStatusTransferenciaId', 'FN') IS NOT NULL
    DROP FUNCTION fn_GetStatusTransferenciaId;

IF OBJECT_ID('fn_GetTipoPosseId', 'FN') IS NOT NULL
    DROP FUNCTION fn_GetTipoPosseId;

IF OBJECT_ID('fn_GetTipoUsoEdificacaoId', 'FN') IS NOT NULL
    DROP FUNCTION fn_GetTipoUsoEdificacaoId;

-- Remover tabelas se já existirem
IF OBJECT_ID('TiposPosse', 'U') IS NOT NULL
    DROP TABLE TiposPosse;

IF OBJECT_ID('TiposUsoEdificacao', 'U') IS NOT NULL
    DROP TABLE TiposUsoEdificacao;

-- Criar tabela de tipos de posse
CREATE TABLE TiposPosse (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(50) NOT NULL UNIQUE,
    Descricao NVARCHAR(255),
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

GO
CREATE TABLE TiposUsoEdificacao (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(50) NOT NULL UNIQUE,
    Descricao NVARCHAR(255),
    DataCriacao DATETIME2 NOT NULL DEFAULT GETDATE(),
    DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Inserir dados nas novas tabelas de domínio
GO
INSERT INTO TiposPosse (Nome, Descricao) VALUES
('Proprietário', 'Proprietário do imóvel'),
('Locatário', 'Locatário do imóvel'),
('Comodato', 'Imóvel em comodato'),
('Outros', 'Outros tipos de posse');

GO
INSERT INTO TiposUsoEdificacao (Nome, Descricao) VALUES
('Residencial Unifamiliar', 'Edificação para uma única família'),
('Residencial Multifamiliar', 'Edificação para múltiplas famílias'),
('Comercial', 'Edificação para fins comerciais'),
('Industrial', 'Edificação para fins industriais'),
('Misto', 'Edificação com uso misto'),
('Terreno sem edificação', 'Terreno sem construções'),
('Outros', 'Outros tipos de uso e edificação');

-- Verificar se as colunas já existem antes de adicioná-las
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Imoveis')
BEGIN
    -- Verificar cada coluna individualmente
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'AreaTerreno')
    BEGIN
        ALTER TABLE Imoveis ADD AreaTerreno DECIMAL(18,2) NULL;
        PRINT 'Coluna AreaTerreno adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'AreaDesmembrada')
    BEGIN
        ALTER TABLE Imoveis ADD AreaDesmembrada DECIMAL(18,2) NULL;
        PRINT 'Coluna AreaDesmembrada adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'AreaRemanescente')
    BEGIN
        ALTER TABLE Imoveis ADD AreaRemanescente DECIMAL(18,2) NULL;
        PRINT 'Coluna AreaRemanescente adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'ValorVenal')
    BEGIN
        ALTER TABLE Imoveis ADD ValorVenal DECIMAL(18,2) NULL;
        PRINT 'Coluna ValorVenal adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'RegistroIPTU')
    BEGIN
        ALTER TABLE Imoveis ADD RegistroIPTU NVARCHAR(50) NULL;
        PRINT 'Coluna RegistroIPTU adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'Latitude')
    BEGIN
        ALTER TABLE Imoveis ADD Latitude DECIMAL(10,8) NULL;
        PRINT 'Coluna Latitude adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'Longitude')
    BEGIN
        ALTER TABLE Imoveis ADD Longitude DECIMAL(11,8) NULL;
        PRINT 'Coluna Longitude adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'PontoReferencia')
    BEGIN
        ALTER TABLE Imoveis ADD PontoReferencia NVARCHAR(255) NULL;
        PRINT 'Coluna PontoReferencia adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'TipoPosseId')
    BEGIN
        ALTER TABLE Imoveis ADD TipoPosseId INT NULL;
        PRINT 'Coluna TipoPosseId adicionada.';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'TipoUsoEdificacaoId')
    BEGIN
        ALTER TABLE Imoveis ADD TipoUsoEdificacaoId INT NULL;
        PRINT 'Coluna TipoUsoEdificacaoId adicionada.';
    END

    -- Adicionar foreign keys se as tabelas de referência existirem
    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TiposPosse') AND 
       EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'TipoPosseId')
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Imoveis_TipoPosseId')
        BEGIN
            ALTER TABLE Imoveis ADD CONSTRAINT FK_Imoveis_TipoPosseId FOREIGN KEY (TipoPosseId) REFERENCES TiposPosse(Id);
            PRINT 'Foreign key FK_Imoveis_TipoPosseId adicionada.';
        END
    END

    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'TiposUsoEdificacao') AND 
       EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Imoveis') AND name = 'TipoUsoEdificacaoId')
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Imoveis_TipoUsoEdificacaoId')
        BEGIN
            ALTER TABLE Imoveis ADD CONSTRAINT FK_Imoveis_TipoUsoEdificacaoId FOREIGN KEY (TipoUsoEdificacaoId) REFERENCES TiposUsoEdificacao(Id);
            PRINT 'Foreign key FK_Imoveis_TipoUsoEdificacaoId adicionada.';
        END
    END
END
ELSE
BEGIN
    PRINT 'Tabela Imoveis não existe. Execute primeiro o script de criação da tabela.';
END

-- Criar tabela para infraestrutura se não existir
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Infraestrutura')
BEGIN
    CREATE TABLE Infraestrutura (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ImovelId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Imoveis(Id),
        Agua BIT NOT NULL DEFAULT 0,
        Esgoto BIT NOT NULL DEFAULT 0,
        Energia BIT NOT NULL DEFAULT 0,
        Pavimentacao BIT NOT NULL DEFAULT 0,
        Iluminacao BIT NOT NULL DEFAULT 0,
        ColetaLixo BIT NOT NULL DEFAULT 0,
        DataCadastro DATETIME2 NOT NULL DEFAULT GETDATE(),
        DataAtualizacao DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabela Infraestrutura criada.';
END
ELSE
BEGIN
    PRINT 'Tabela Infraestrutura já existe.';
END

-- Criar índices para os novos campos
GO
CREATE INDEX IX_Imoveis_TipoPosseId ON Imoveis(TipoPosseId);
CREATE INDEX IX_Imoveis_TipoUsoEdificacaoId ON Imoveis(TipoUsoEdificacaoId);
CREATE INDEX IX_Infraestrutura_ImovelId ON Infraestrutura(ImovelId);

-- Criar stored procedures para operações comuns
GO
CREATE PROCEDURE sp_CadastrarImovel
    @Matricula NVARCHAR(100),
    @Localizacao NVARCHAR(255),
    @AreaM2 DECIMAL(18,2),
    @Objeto NVARCHAR(255),
    @Observacao NVARCHAR(MAX),
    @TipoImovelId INT,
    @FinalidadeId INT,
    @StatusTransferenciaId INT,
    @ImovelPaiId UNIQUEIDENTIFIER = NULL,
    @UsuarioCadastroId UNIQUEIDENTIFIER,
    @AreaTerreno DECIMAL(18,2) = NULL,
    @ValorVenal DECIMAL(18,2) = NULL,
    @RegistroIPTU NVARCHAR(100) = NULL,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL,
    @PontoReferencia NVARCHAR(255) = NULL,
    @TipoPosseId INT = NULL,
    @TipoUsoEdificacaoId INT = NULL,
    @Agua BIT = 0,
    @Esgoto BIT = 0,
    @Energia BIT = 0,
    @Pavimentacao BIT = 0,
    @Iluminacao BIT = 0,
    @ColetaLixo BIT = 0
AS
BEGIN
    DECLARE @ImovelId UNIQUEIDENTIFIER = NEWID();
    
    -- Inserir o imóvel
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, Observacao,
        TipoImovelId, FinalidadeId, StatusTransferenciaId, ImovelPaiId,
        UsuarioCadastroId, UsuarioAtualizacaoId,
        AreaTerreno, ValorVenal, RegistroIPTU, Latitude, Longitude,
        PontoReferencia, TipoPosseId, TipoUsoEdificacaoId
    )
    VALUES (
        @ImovelId, @Matricula, @Localizacao, @AreaM2, @Objeto, @Observacao,
        @TipoImovelId, @FinalidadeId, @StatusTransferenciaId, @ImovelPaiId,
        @UsuarioCadastroId, @UsuarioCadastroId,
        @AreaTerreno, @ValorVenal, @RegistroIPTU, @Latitude, @Longitude,
        @PontoReferencia, @TipoPosseId, @TipoUsoEdificacaoId
    );
    
    -- Inserir a infraestrutura
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelId, @Agua, @Esgoto, @Energia, @Pavimentacao, @Iluminacao, @ColetaLixo
    );
    
    -- Retornar o ID do imóvel criado
    SELECT @ImovelId AS Id;
END;

GO
CREATE PROCEDURE sp_AtualizarImovel
    @Id UNIQUEIDENTIFIER,
    @Matricula NVARCHAR(100),
    @Localizacao NVARCHAR(255),
    @AreaM2 DECIMAL(18,2),
    @Objeto NVARCHAR(255),
    @Observacao NVARCHAR(MAX),
    @TipoImovelId INT,
    @FinalidadeId INT,
    @StatusTransferenciaId INT,
    @ImovelPaiId UNIQUEIDENTIFIER = NULL,
    @UsuarioAtualizacaoId UNIQUEIDENTIFIER,
    @AreaTerreno DECIMAL(18,2) = NULL,
    @AreaDesmembrada DECIMAL(18,2) = NULL,
    @AreaRemanescente DECIMAL(18,2) = NULL,
    @ValorVenal DECIMAL(18,2) = NULL,
    @RegistroIPTU NVARCHAR(100) = NULL,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL,
    @PontoReferencia NVARCHAR(255) = NULL,
    @TipoPosseId INT = NULL,
    @TipoUsoEdificacaoId INT = NULL
AS
BEGIN
    -- Atualizar o imóvel
    UPDATE Imoveis SET
        Matricula = @Matricula,
        Localizacao = @Localizacao,
        AreaM2 = @AreaM2,
        Objeto = @Objeto,
        Observacao = @Observacao,
        TipoImovelId = @TipoImovelId,
        FinalidadeId = @FinalidadeId,
        StatusTransferenciaId = @StatusTransferenciaId,
        ImovelPaiId = @ImovelPaiId,
        UsuarioAtualizacaoId = @UsuarioAtualizacaoId,
        DataAtualizacao = GETDATE(),
        AreaTerreno = @AreaTerreno,
        AreaDesmembrada = @AreaDesmembrada,
        AreaRemanescente = @AreaRemanescente,
        ValorVenal = @ValorVenal,
        RegistroIPTU = @RegistroIPTU,
        Latitude = @Latitude,
        Longitude = @Longitude,
        PontoReferencia = @PontoReferencia,
        TipoPosseId = @TipoPosseId,
        TipoUsoEdificacaoId = @TipoUsoEdificacaoId
    WHERE Id = @Id;
END;

GO
CREATE PROCEDURE sp_AtualizarInfraestrutura
    @ImovelId UNIQUEIDENTIFIER,
    @Agua BIT,
    @Esgoto BIT,
    @Energia BIT,
    @Pavimentacao BIT,
    @Iluminacao BIT,
    @ColetaLixo BIT
AS
BEGIN
    -- Verificar se já existe infraestrutura para este imóvel
    IF EXISTS (SELECT 1 FROM Infraestrutura WHERE ImovelId = @ImovelId)
    BEGIN
        -- Atualizar a infraestrutura existente
        UPDATE Infraestrutura SET
            Agua = @Agua,
            Esgoto = @Esgoto,
            Energia = @Energia,
            Pavimentacao = @Pavimentacao,
            Iluminacao = @Iluminacao,
            ColetaLixo = @ColetaLixo,
            DataAtualizacao = GETDATE()
        WHERE ImovelId = @ImovelId;
    END
    ELSE
    BEGIN
        -- Inserir nova infraestrutura
        INSERT INTO Infraestrutura (
            ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
        )
        VALUES (
            @ImovelId, @Agua, @Esgoto, @Energia, @Pavimentacao, @Iluminacao, @ColetaLixo
        );
    END
END;

GO
CREATE PROCEDURE sp_ObterImovelCompleto
    @ImovelId UNIQUEIDENTIFIER
AS
BEGIN
    -- Obter dados do imóvel
    SELECT 
        i.*,
        ti.Nome AS TipoImovelNome,
        f.Nome AS FinalidadeNome,
        st.Nome AS StatusTransferenciaNome,
        tp.Nome AS TipoPosseNome,
        tue.Nome AS TipoUsoEdificacaoNome,
        ip.Matricula AS ImovelPaiMatricula,
        uc.Nome AS UsuarioCadastroNome,
        ua.Nome AS UsuarioAtualizacaoNome,
        infra.Agua,
        infra.Esgoto,
        infra.Energia,
        infra.Pavimentacao,
        infra.Iluminacao,
        infra.ColetaLixo,
        (
            SELECT STRING_AGG(mo.Matricula, ', ')
            FROM MatriculasOriginadas mo
            WHERE mo.ImovelId = i.Id
        ) AS MatriculasOriginadas
    FROM 
        Imoveis i
        INNER JOIN TiposImovel ti ON i.TipoImovelId = ti.Id
        INNER JOIN Finalidades f ON i.FinalidadeId = f.Id
        INNER JOIN StatusTransferencia st ON i.StatusTransferenciaId = st.Id
        LEFT JOIN TiposPosse tp ON i.TipoPosseId = tp.Id
        LEFT JOIN TiposUsoEdificacao tue ON i.TipoUsoEdificacaoId = tue.Id
        LEFT JOIN Imoveis ip ON i.ImovelPaiId = ip.Id
        INNER JOIN Usuarios uc ON i.UsuarioCadastroId = uc.Id
        INNER JOIN Usuarios ua ON i.UsuarioAtualizacaoId = ua.Id
        LEFT JOIN Infraestrutura infra ON i.Id = infra.ImovelId
    WHERE 
        i.Id = @ImovelId;
        
    -- Obter documentos do imóvel
    SELECT 
        d.*,
        u.Nome AS UsuarioUploadNome
    FROM 
        Documentos d
        INNER JOIN Usuarios u ON d.UsuarioUploadId = u.Id
    WHERE 
        d.ImovelId = @ImovelId
    ORDER BY 
        d.DataUpload DESC;
END;

GO
CREATE PROCEDURE sp_ListarImoveisPrincipais
AS
BEGIN
    SELECT 
        i.Id,
        i.Matricula,
        i.Localizacao,
        i.AreaM2,
        i.Objeto,
        i.Observacao,
        ti.Nome AS TipoImovel,
        f.Nome AS Finalidade,
        st.Nome AS StatusTransferencia,
        i.DataCadastro,
        i.DataAtualizacao,
        u.Nome AS UsuarioCadastro,
        i.AreaTerreno,
        i.ValorVenal,
        i.RegistroIPTU,
        i.Latitude,
        i.Longitude,
        i.PontoReferencia,
        tp.Nome AS TipoPosse,
        tue.Nome AS TipoUsoEdificacao,
        (SELECT COUNT(*) FROM Imoveis sec WHERE sec.ImovelPaiId = i.Id) AS QtdImoveisSecundarios
    FROM 
        Imoveis i
        INNER JOIN TiposImovel ti ON i.TipoImovelId = ti.Id
        INNER JOIN Finalidades f ON i.FinalidadeId = f.Id
        INNER JOIN StatusTransferencia st ON i.StatusTransferenciaId = st.Id
        LEFT JOIN TiposPosse tp ON i.TipoPosseId = tp.Id
        LEFT JOIN TiposUsoEdificacao tue ON i.TipoUsoEdificacaoId = tue.Id
        INNER JOIN Usuarios u ON i.UsuarioCadastroId = u.Id
    WHERE 
        i.ImovelPaiId IS NULL
    ORDER BY 
        i.Matricula;
END;

GO
CREATE PROCEDURE sp_BuscarImoveis
    @TermoBusca NVARCHAR(100)
AS
BEGIN
    SELECT 
        i.Id,
        i.Matricula,
        i.Localizacao,
        i.AreaM2,
        i.Objeto,
        ti.Nome AS TipoImovel,
        f.Nome AS Finalidade,
        st.Nome AS StatusTransferencia,
        CASE WHEN i.ImovelPaiId IS NULL THEN 'Principal' ELSE 'Secundário' END AS Tipo,
        i.DataCadastro,
        i.AreaTerreno,
        i.ValorVenal,
        i.RegistroIPTU,
        tp.Nome AS TipoPosse,
        tue.Nome AS TipoUsoEdificacao
    FROM 
        Imoveis i
        INNER JOIN TiposImovel ti ON i.TipoImovelId = ti.Id
        INNER JOIN Finalidades f ON i.FinalidadeId = f.Id
        INNER JOIN StatusTransferencia st ON i.StatusTransferenciaId = st.Id
        LEFT JOIN TiposPosse tp ON i.TipoPosseId = tp.Id
        LEFT JOIN TiposUsoEdificacao tue ON i.TipoUsoEdificacaoId = tue.Id
    WHERE 
        i.Matricula LIKE '%' + @TermoBusca + '%' OR
        i.Localizacao LIKE '%' + @TermoBusca + '%' OR
        i.Objeto LIKE '%' + @TermoBusca + '%' OR
        i.RegistroIPTU LIKE '%' + @TermoBusca + '%' OR
        i.PontoReferencia LIKE '%' + @TermoBusca + '%'
    ORDER BY 
        i.Matricula;
END;

-- Criar funções auxiliares para obter IDs a partir de nomes
GO
CREATE FUNCTION fn_GetTipoImovelId(@Nome NVARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @Id INT;
    
    SELECT @Id = Id FROM TiposImovel WHERE Nome = @Nome;
    
    IF @Id IS NULL
        RETURN (SELECT Id FROM TiposImovel WHERE Nome = 'Outros');
        
    RETURN @Id;
END;

GO
CREATE FUNCTION fn_GetFinalidadeId(@Nome NVARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @Id INT;
    
    SELECT @Id = Id FROM Finalidades WHERE Nome = @Nome;
    
    IF @Id IS NULL
        RETURN (SELECT Id FROM Finalidades WHERE Nome = 'Outros');
        
    RETURN @Id;
END;

GO
CREATE FUNCTION fn_GetStatusTransferenciaId(@Nome NVARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @Id INT;
    
    SELECT @Id = Id FROM StatusTransferencia WHERE Nome = @Nome;
    
    IF @Id IS NULL
        RETURN (SELECT Id FROM StatusTransferencia WHERE Nome = 'Não transferido');
        
    RETURN @Id;
END;

GO
CREATE FUNCTION fn_GetTipoPosseId(@Nome NVARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @Id INT;
    
    SELECT @Id = Id FROM TiposPosse WHERE Nome = @Nome;
    
    IF @Id IS NULL
        RETURN (SELECT Id FROM TiposPosse WHERE Nome = 'Outros');
        
    RETURN @Id;
END;

GO
CREATE FUNCTION fn_GetTipoUsoEdificacaoId(@Nome NVARCHAR(50))
RETURNS INT
AS
BEGIN
    DECLARE @Id INT;
    
    SELECT @Id = Id FROM TiposUsoEdificacao WHERE Nome = @Nome;
    
    IF @Id IS NULL
        RETURN (SELECT Id FROM TiposUsoEdificacao WHERE Nome = 'Outros');
        
    RETURN @Id;
END;
