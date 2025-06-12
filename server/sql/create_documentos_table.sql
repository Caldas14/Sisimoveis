-- Criar tabela para armazenar referências de documentos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DocumentosImoveis')
BEGIN
    CREATE TABLE DocumentosImoveis (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ImovelId UNIQUEIDENTIFIER NOT NULL,
        Caminho NVARCHAR(1000) NOT NULL,
        Nome NVARCHAR(255) NOT NULL,
        Tipo NVARCHAR(50) NULL,
        DataCriacao DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_DocumentosImoveis_Imoveis FOREIGN KEY (ImovelId)
        REFERENCES Imoveis(Id) ON DELETE CASCADE
    );
END

-- Criar índice para melhorar a performance de consultas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DocumentosImoveis_ImovelId')
BEGIN
    CREATE INDEX IX_DocumentosImoveis_ImovelId ON DocumentosImoveis(ImovelId);
END

-- Criar view para buscar documentos com informações do imóvel
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_DocumentosImoveis')
BEGIN
    DROP VIEW vw_DocumentosImoveis;
END

GO

CREATE VIEW vw_DocumentosImoveis AS
SELECT 
    d.Id,
    d.ImovelId,
    d.Caminho,
    d.Nome,
    d.Tipo,
    d.DataCriacao,
    i.Matricula,
    i.Objeto,
    i.Localizacao,
    i.ImovelPaiId,
    CASE 
        WHEN EXISTS (SELECT 1 FROM Imoveis WHERE ImovelPaiId = i.Id) THEN 'Principal'
        WHEN i.ImovelPaiId IS NOT NULL THEN 'Secundário'
        ELSE 'Principal'
    END AS TipoImovel
FROM 
    DocumentosImoveis d
    INNER JOIN Imoveis i ON d.ImovelId = i.Id;

GO
