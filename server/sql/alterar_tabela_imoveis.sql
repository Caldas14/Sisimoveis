-- Remover colunas não utilizadas da tabela Imoveis
ALTER TABLE Imoveis DROP COLUMN AreaTerreno;
GO

ALTER TABLE Imoveis DROP COLUMN AreaDesmembrada;
GO

ALTER TABLE Imoveis DROP COLUMN AreaRemanescente;
GO

-- Verificar se a tabela InfraestruturaImoveis já existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InfraestruturaImoveis')
BEGIN
    -- Criar tabela de infraestrutura para imóveis
    CREATE TABLE InfraestruturaImoveis (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ImovelId UNIQUEIDENTIFIER NOT NULL,
        Agua BIT NOT NULL DEFAULT 0,
        Esgoto BIT NOT NULL DEFAULT 0,
        Energia BIT NOT NULL DEFAULT 0,
        Pavimentacao BIT NOT NULL DEFAULT 0,
        Iluminacao BIT NOT NULL DEFAULT 0,
        ColetaLixo BIT NOT NULL DEFAULT 0,
        DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
        DataAtualizacao DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_InfraestruturaImoveis_Imoveis FOREIGN KEY (ImovelId) REFERENCES Imoveis(Id) ON DELETE CASCADE
    );

    -- Adicionar índice para melhorar a performance de consultas
    CREATE INDEX IX_InfraestruturaImoveis_ImovelId ON InfraestruturaImoveis(ImovelId);
END
GO

-- Atualizar a view para refletir as alterações
CREATE OR ALTER VIEW vw_Imoveis AS
SELECT 
    i.Id,
    i.Matricula,
    i.Localizacao,
    i.AreaM2 as Area,
    i.Objeto,
    i.TipoImovelId,
    ti.Nome as TipoImovel,
    i.FinalidadeId,
    f.Nome as Finalidade,
    i.StatusTransferenciaId,
    st.Nome as StatusTransferencia,
    i.ImovelPaiId,
    pai.Matricula as MatriculaImovelPai,
    pai.Localizacao as LocalizacaoImovelPai,
    i.DataCadastro,
    i.DataAtualizacao,
    i.ValorVenal,
    i.RegistroIPTU,
    i.Latitude,
    i.Longitude,
    i.PontoReferencia,
    i.TipoPosseId,
    tp.Nome as TipoPosse,
    i.TipoUsoEdificacaoId,
    tue.Nome as TipoUsoEdificacao,
    i.Observacao,
    CASE 
        WHEN i.ImovelPaiId IS NULL THEN 'Principal'
        ELSE 'Secundário'
    END as TipoRelacao,
    (SELECT COUNT(*) FROM Imoveis filhos WHERE filhos.ImovelPaiId = i.Id) as NumeroImoveisSecundarios,
    ISNULL(inf.Agua, 0) as Agua,
    ISNULL(inf.Esgoto, 0) as Esgoto,
    ISNULL(inf.Energia, 0) as Energia,
    ISNULL(inf.Pavimentacao, 0) as Pavimentacao,
    ISNULL(inf.Iluminacao, 0) as Iluminacao,
    ISNULL(inf.ColetaLixo, 0) as ColetaLixo
FROM 
    Imoveis i
LEFT JOIN 
    TiposImovel ti ON i.TipoImovelId = ti.Id
LEFT JOIN 
    Finalidades f ON i.FinalidadeId = f.Id
LEFT JOIN 
    StatusTransferencia st ON i.StatusTransferenciaId = st.Id
LEFT JOIN 
    TiposPosse tp ON i.TipoPosseId = tp.Id
LEFT JOIN 
    TiposUsoEdificacao tue ON i.TipoUsoEdificacaoId = tue.Id
LEFT JOIN
    Imoveis pai ON i.ImovelPaiId = pai.Id
LEFT JOIN
    InfraestruturaImoveis inf ON i.Id = inf.ImovelId;
GO
