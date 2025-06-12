-- Procedimento armazenado para cadastrar um novo imóvel
CREATE OR ALTER PROCEDURE sp_CadastrarImovel
    @Id UNIQUEIDENTIFIER,
    @Matricula NVARCHAR(100),
    @Localizacao NVARCHAR(255),
    @AreaM2 FLOAT,
    @Objeto NVARCHAR(MAX),
    @TipoImovelId INT,
    @FinalidadeId INT,
    @StatusTransferenciaId INT,
    @ImovelPaiId UNIQUEIDENTIFIER = NULL,

    @ValorVenal DECIMAL(18, 2) = 0,
    @RegistroIPTU NVARCHAR(100) = NULL,
    @Latitude FLOAT = 0,
    @Longitude FLOAT = 0,
    @PontoReferencia NVARCHAR(255) = NULL,
    @TipoPosseId INT = NULL,
    @TipoUsoEdificacaoId INT = NULL,
    @Observacao NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar se o ImovelPaiId é válido (se fornecido)
    IF @ImovelPaiId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Imoveis WHERE Id = @ImovelPaiId)
    BEGIN
        RAISERROR('Imóvel principal não encontrado. O ID fornecido não existe.', 16, 1);
        RETURN;
    END
    
    -- Inserir o imóvel
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, 
        TipoImovelId, FinalidadeId, StatusTransferenciaId, ImovelPaiId,
        DataCadastro, DataAtualizacao,
        ValorVenal, RegistroIPTU, Latitude, Longitude, PontoReferencia,
        TipoPosseId, TipoUsoEdificacaoId, Observacao
    ) VALUES (
        @Id, @Matricula, @Localizacao, @AreaM2, @Objeto,
        @TipoImovelId, @FinalidadeId, @StatusTransferenciaId, @ImovelPaiId,
        GETDATE(), GETDATE(),
        @ValorVenal, @RegistroIPTU, @Latitude, @Longitude, @PontoReferencia,
        @TipoPosseId, @TipoUsoEdificacaoId, @Observacao
    );
    
    -- Retornar o ID do imóvel cadastrado
    SELECT @Id AS Id;
END
GO
