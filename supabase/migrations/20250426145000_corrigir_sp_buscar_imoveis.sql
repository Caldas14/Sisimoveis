-- Script para corrigir a stored procedure sp_BuscarImoveis
USE SistemaCadastroImoveis;
GO

-- Remover a stored procedure existente se ela existir
IF OBJECT_ID('sp_BuscarImoveis', 'P') IS NOT NULL
    DROP PROCEDURE sp_BuscarImoveis;
GO

-- Criar a stored procedure corrigida
CREATE PROCEDURE sp_BuscarImoveis
    @Matricula VARCHAR(50) = NULL,
    @Localizacao VARCHAR(255) = NULL,
    @TipoImovel VARCHAR(50) = NULL,
    @StatusTransferencia VARCHAR(50) = NULL,
    @ApenasPrincipais BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        i.Id,
        i.Matricula,
        i.Localizacao,
        i.AreaM2 as Area,
        i.Objeto,
        i.TipoImovelId,
        ISNULL(ti.Nome, 'Desconhecido') as TipoImovel,
        i.FinalidadeId,
        ISNULL(f.Nome, 'Desconhecido') as Finalidade,
        i.StatusTransferenciaId,
        ISNULL(st.Nome, 'Desconhecido') as StatusTransferencia,
        i.ImovelPaiId,
        i.DataCadastro,
        i.DataAtualizacao,
        i.AreaTerreno,
        i.AreaDesmembrada,
        i.AreaRemanescente,
        i.ValorVenal,
        i.RegistroIPTU,
        i.Latitude,
        i.Longitude,
        i.PontoReferencia,
        i.TipoPosseId,
        ISNULL(tp.Nome, 'Desconhecido') as TipoPosse,
        i.TipoUsoEdificacaoId,
        ISNULL(tue.Nome, 'Desconhecido') as TipoUsoEdificacao,
        i.Observacao
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
    WHERE 
        (@Matricula IS NULL OR i.Matricula LIKE '%' + @Matricula + '%')
        AND (@Localizacao IS NULL OR i.Localizacao LIKE '%' + @Localizacao + '%')
        AND (@TipoImovel IS NULL OR ti.Nome = @TipoImovel)
        AND (@StatusTransferencia IS NULL OR st.Nome = @StatusTransferencia)
        AND (@ApenasPrincipais = 0 OR i.ImovelPaiId IS NULL)
    ORDER BY 
        i.DataCadastro DESC;
END;
GO

-- Remover a stored procedure existente se ela existir
IF OBJECT_ID('sp_BuscarImoveisSecundarios', 'P') IS NOT NULL
    DROP PROCEDURE sp_BuscarImoveisSecundarios;
GO

-- Criar a stored procedure corrigida
CREATE PROCEDURE sp_BuscarImoveisSecundarios
    @ImovelPaiId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        i.Id,
        i.Matricula,
        i.Localizacao,
        i.AreaM2 as Area,
        i.Objeto,
        i.TipoImovelId,
        ISNULL(ti.Nome, 'Desconhecido') as TipoImovel,
        i.FinalidadeId,
        ISNULL(f.Nome, 'Desconhecido') as Finalidade,
        i.StatusTransferenciaId,
        ISNULL(st.Nome, 'Desconhecido') as StatusTransferencia,
        i.ImovelPaiId,
        i.DataCadastro,
        i.DataAtualizacao,
        i.AreaTerreno,
        i.AreaDesmembrada,
        i.AreaRemanescente,
        i.ValorVenal,
        i.RegistroIPTU,
        i.Latitude,
        i.Longitude,
        i.PontoReferencia,
        i.TipoPosseId,
        ISNULL(tp.Nome, 'Desconhecido') as TipoPosse,
        i.TipoUsoEdificacaoId,
        ISNULL(tue.Nome, 'Desconhecido') as TipoUsoEdificacao,
        i.Observacao
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
    WHERE 
        i.ImovelPaiId = @ImovelPaiId
    ORDER BY 
        i.DataCadastro DESC;
END;
GO

PRINT 'Stored procedures corrigidas com sucesso!';
GO
