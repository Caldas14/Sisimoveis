-- Criar uma view para visualizar todos os dados dos imóveis
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
    (SELECT COUNT(*) FROM Imoveis filhos WHERE filhos.ImovelPaiId = i.Id) as NumeroImoveisSecundarios
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

-- Exemplo de consulta usando a view
-- SELECT * FROM vw_Imoveis WHERE TipoRelacao = 'Principal';
-- SELECT * FROM vw_Imoveis WHERE TipoRelacao = 'Secundário';
-- SELECT * FROM vw_Imoveis WHERE TipoImovel = 'Terreno';
-- SELECT * FROM vw_Imoveis WHERE Finalidade = 'Comercial';

-- Consulta para obter imóveis principais com contagem de secundários
-- SELECT Id, Matricula, Localizacao, Area, TipoImovel, NumeroImoveisSecundarios 
-- FROM vw_Imoveis 
-- WHERE TipoRelacao = 'Principal' 
-- ORDER BY NumeroImoveisSecundarios DESC;

-- Consulta para obter imóveis secundários com informações do imóvel principal
-- SELECT Id, Matricula, Localizacao, Area, ImovelPaiId, MatriculaImovelPai, LocalizacaoImovelPai 
-- FROM vw_Imoveis 
-- WHERE TipoRelacao = 'Secundário';
