-- Função para calcular a área total desmembrada de um imóvel principal
CREATE OR ALTER FUNCTION dbo.CalcularAreaDesmembrada
(
    @ImovelPaiId UNIQUEIDENTIFIER
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @AreaDesmembrada DECIMAL(18,2)

    -- Soma todas as áreas dos imóveis secundários
    SELECT @AreaDesmembrada = ISNULL(SUM(AreaM2), 0)
    FROM Imoveis
    WHERE ImovelPaiId = @ImovelPaiId

    RETURN @AreaDesmembrada
END
GO

-- Atualizar a view de imóveis para incluir a área desmembrada
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
    -- Adicionar área desmembrada apenas para imóveis principais
    CASE 
        WHEN i.ImovelPaiId IS NULL THEN dbo.CalcularAreaDesmembrada(i.Id)
        ELSE 0 
    END as AreaDesmembrada,
    -- Calcular área remanescente
    CASE 
        WHEN i.ImovelPaiId IS NULL THEN i.AreaM2 - dbo.CalcularAreaDesmembrada(i.Id)
        ELSE 0
    END as AreaRemanescente,
    -- Calcular percentual desmembrado
    CASE 
        WHEN i.ImovelPaiId IS NULL AND i.AreaM2 > 0 
        THEN (dbo.CalcularAreaDesmembrada(i.Id) / i.AreaM2) * 100
        ELSE 0
    END as PercentualDesmembrado
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
    Imoveis pai ON i.ImovelPaiId = pai.Id;
GO
