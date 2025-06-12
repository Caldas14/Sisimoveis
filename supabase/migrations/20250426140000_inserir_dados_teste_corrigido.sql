-- Script corrigido para adicionar dados de teste ao banco de dados
USE SistemaCadastroImoveis;
GO

-- Verificar se existe o usuário admin para usar como referência
DECLARE @UsuarioId UNIQUEIDENTIFIER;

-- Obter ID do usuário admin ou criar um novo se não existir
SELECT @UsuarioId = Id FROM Usuarios WHERE Email = 'admin@sistema.com';

IF @UsuarioId IS NULL
BEGIN
    SET @UsuarioId = NEWID();
    
    -- Criar usuário admin se não existir
    INSERT INTO Usuarios (Id, Nome, Email, Senha, Ativo)
    VALUES (@UsuarioId, 'Admin Usuário', 'admin@sistema.com', 'admin123', 1);
    
    -- Verificar se existe o perfil Administrador
    IF NOT EXISTS (SELECT 1 FROM Perfis WHERE Nome = 'Administrador')
    BEGIN
        INSERT INTO Perfis (Nome, Descricao)
        VALUES ('Administrador', 'Acesso total ao sistema');
    END
    
    -- Atribuir perfil administrador ao usuário admin
    INSERT INTO UsuariosPerfis (UsuarioId, PerfilId)
    SELECT @UsuarioId, (SELECT Id FROM Perfis WHERE Nome = 'Administrador');
END

-- Inserir tipos de imóveis se não existirem
IF NOT EXISTS (SELECT 1 FROM TiposImovel WHERE Nome = 'Terreno')
    INSERT INTO TiposImovel (Nome) VALUES ('Terreno');

IF NOT EXISTS (SELECT 1 FROM TiposImovel WHERE Nome = 'Casa')
    INSERT INTO TiposImovel (Nome) VALUES ('Casa');

IF NOT EXISTS (SELECT 1 FROM TiposImovel WHERE Nome = 'Apartamento')
    INSERT INTO TiposImovel (Nome) VALUES ('Apartamento');

IF NOT EXISTS (SELECT 1 FROM TiposImovel WHERE Nome = 'Comercial')
    INSERT INTO TiposImovel (Nome) VALUES ('Comercial');

IF NOT EXISTS (SELECT 1 FROM TiposImovel WHERE Nome = 'Rural')
    INSERT INTO TiposImovel (Nome) VALUES ('Rural');

-- Inserir finalidades se não existirem
IF NOT EXISTS (SELECT 1 FROM Finalidades WHERE Nome = 'Residencial')
    INSERT INTO Finalidades (Nome) VALUES ('Residencial');

IF NOT EXISTS (SELECT 1 FROM Finalidades WHERE Nome = 'Comercial')
    INSERT INTO Finalidades (Nome) VALUES ('Comercial');

IF NOT EXISTS (SELECT 1 FROM Finalidades WHERE Nome = 'Industrial')
    INSERT INTO Finalidades (Nome) VALUES ('Industrial');

IF NOT EXISTS (SELECT 1 FROM Finalidades WHERE Nome = 'Rural')
    INSERT INTO Finalidades (Nome) VALUES ('Rural');

-- Inserir status de transferência se não existirem
IF NOT EXISTS (SELECT 1 FROM StatusTransferencia WHERE Nome = 'Disponível')
    INSERT INTO StatusTransferencia (Nome) VALUES ('Disponível');

IF NOT EXISTS (SELECT 1 FROM StatusTransferencia WHERE Nome = 'Em Transferência')
    INSERT INTO StatusTransferencia (Nome) VALUES ('Em Transferência');

IF NOT EXISTS (SELECT 1 FROM StatusTransferencia WHERE Nome = 'Transferido')
    INSERT INTO StatusTransferencia (Nome) VALUES ('Transferido');

-- Inserir tipos de posse se não existirem
IF NOT EXISTS (SELECT 1 FROM TiposPosse WHERE Nome = 'Proprietário')
    INSERT INTO TiposPosse (Nome) VALUES ('Proprietário');

IF NOT EXISTS (SELECT 1 FROM TiposPosse WHERE Nome = 'Locatário')
    INSERT INTO TiposPosse (Nome) VALUES ('Locatário');

IF NOT EXISTS (SELECT 1 FROM TiposPosse WHERE Nome = 'Comodato')
    INSERT INTO TiposPosse (Nome) VALUES ('Comodato');

-- Inserir tipos de uso de edificação se não existirem
IF NOT EXISTS (SELECT 1 FROM TiposUsoEdificacao WHERE Nome = 'Residencial')
    INSERT INTO TiposUsoEdificacao (Nome) VALUES ('Residencial');

IF NOT EXISTS (SELECT 1 FROM TiposUsoEdificacao WHERE Nome = 'Comercial')
    INSERT INTO TiposUsoEdificacao (Nome) VALUES ('Comercial');

IF NOT EXISTS (SELECT 1 FROM TiposUsoEdificacao WHERE Nome = 'Misto')
    INSERT INTO TiposUsoEdificacao (Nome) VALUES ('Misto');

IF NOT EXISTS (SELECT 1 FROM TiposUsoEdificacao WHERE Nome = 'Industrial')
    INSERT INTO TiposUsoEdificacao (Nome) VALUES ('Industrial');

-- Variáveis para armazenar IDs
DECLARE @TipoImovelTerrenoId INT;
DECLARE @TipoImovelCasaId INT;
DECLARE @TipoImovelApartamentoId INT;
DECLARE @TipoImovelComercialId INT;
DECLARE @TipoImovelRuralId INT;

DECLARE @FinalidadeResidencialId INT;
DECLARE @FinalidadeComercialId INT;
DECLARE @FinalidadeIndustrialId INT;
DECLARE @FinalidadeRuralId INT;

DECLARE @StatusDisponivelId INT;
DECLARE @StatusEmTransferenciaId INT;
DECLARE @StatusTransferidoId INT;

DECLARE @TipoPosseProprietarioId INT;
DECLARE @TipoPosseLocatarioId INT;
DECLARE @TipoPosseComodatoId INT;

DECLARE @TipoUsoResidencialId INT;
DECLARE @TipoUsoComercialId INT;
DECLARE @TipoUsoMistoId INT;
DECLARE @TipoUsoIndustrialId INT;

-- Obter IDs dos tipos de imóvel
SELECT @TipoImovelTerrenoId = Id FROM TiposImovel WHERE Nome = 'Terreno';
SELECT @TipoImovelCasaId = Id FROM TiposImovel WHERE Nome = 'Casa';
SELECT @TipoImovelApartamentoId = Id FROM TiposImovel WHERE Nome = 'Apartamento';
SELECT @TipoImovelComercialId = Id FROM TiposImovel WHERE Nome = 'Comercial';
SELECT @TipoImovelRuralId = Id FROM TiposImovel WHERE Nome = 'Rural';

-- Obter IDs das finalidades
SELECT @FinalidadeResidencialId = Id FROM Finalidades WHERE Nome = 'Residencial';
SELECT @FinalidadeComercialId = Id FROM Finalidades WHERE Nome = 'Comercial';
SELECT @FinalidadeIndustrialId = Id FROM Finalidades WHERE Nome = 'Industrial';
SELECT @FinalidadeRuralId = Id FROM Finalidades WHERE Nome = 'Rural';

-- Obter IDs dos status de transferência
SELECT @StatusDisponivelId = Id FROM StatusTransferencia WHERE Nome = 'Disponível';
SELECT @StatusEmTransferenciaId = Id FROM StatusTransferencia WHERE Nome = 'Em Transferência';
SELECT @StatusTransferidoId = Id FROM StatusTransferencia WHERE Nome = 'Transferido';

-- Obter IDs dos tipos de posse
SELECT @TipoPosseProprietarioId = Id FROM TiposPosse WHERE Nome = 'Proprietário';
SELECT @TipoPosseLocatarioId = Id FROM TiposPosse WHERE Nome = 'Locatário';
SELECT @TipoPosseComodatoId = Id FROM TiposPosse WHERE Nome = 'Comodato';

-- Obter IDs dos tipos de uso de edificação
SELECT @TipoUsoResidencialId = Id FROM TiposUsoEdificacao WHERE Nome = 'Residencial';
SELECT @TipoUsoComercialId = Id FROM TiposUsoEdificacao WHERE Nome = 'Comercial';
SELECT @TipoUsoMistoId = Id FROM TiposUsoEdificacao WHERE Nome = 'Misto';
SELECT @TipoUsoIndustrialId = Id FROM TiposUsoEdificacao WHERE Nome = 'Industrial';

-- Verificar se existe a tabela Infraestrutura, se não existir, criá-la
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Infraestrutura')
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
    
    CREATE INDEX IX_Infraestrutura_ImovelId ON Infraestrutura(ImovelId);
END

-- Inserir imóveis principais
DECLARE @ImovelId1 UNIQUEIDENTIFIER;
DECLARE @ImovelId2 UNIQUEIDENTIFIER;
DECLARE @ImovelId3 UNIQUEIDENTIFIER;
DECLARE @ImovelId4 UNIQUEIDENTIFIER;
DECLARE @ImovelId5 UNIQUEIDENTIFIER;

-- Imóvel 1: Terreno grande que será desmembrado
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-001-2025')
BEGIN
    SET @ImovelId1 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelId1, 'MAT-001-2025', 'Rua das Flores, 123, Centro', 5000.00, 
        'Terreno para loteamento', @TipoImovelTerrenoId, @FinalidadeResidencialId,
        @StatusDisponivelId, NULL, GETDATE(), GETDATE(),
        5000.00, 2000.00, 3000.00, 500000.00, 'IPTU-001-2025',
        -23.5505, -46.6333, 'Próximo ao Parque Municipal', @TipoPosseProprietarioId, 
        NULL, 'Terreno plano com potencial para loteamento',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel 1
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelId1, 1, 1, 1, 1, 1, 1
    );
END
ELSE
BEGIN
    SELECT @ImovelId1 = Id FROM Imoveis WHERE Matricula = 'MAT-001-2025';
END

-- Imóvel 2: Casa residencial
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-002-2025')
BEGIN
    SET @ImovelId2 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelId2, 'MAT-002-2025', 'Av. Paulista, 1000, Bela Vista', 150.00, 
        'Casa residencial de alto padrão', @TipoImovelCasaId, @FinalidadeResidencialId,
        @StatusEmTransferenciaId, NULL, GETDATE(), GETDATE(),
        300.00, 0.00, 300.00, 800000.00, 'IPTU-002-2025',
        -23.5630, -46.6543, 'Próximo ao MASP', @TipoPosseProprietarioId, 
        @TipoUsoResidencialId, 'Casa com 3 quartos, 2 suítes, piscina e área gourmet',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel 2
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelId2, 1, 1, 1, 1, 1, 1
    );
END
ELSE
BEGIN
    SELECT @ImovelId2 = Id FROM Imoveis WHERE Matricula = 'MAT-002-2025';
END

-- Imóvel 3: Apartamento
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-003-2025')
BEGIN
    SET @ImovelId3 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelId3, 'MAT-003-2025', 'Rua Augusta, 500, Consolação', 80.00, 
        'Apartamento em prédio novo', @TipoImovelApartamentoId, @FinalidadeResidencialId,
        @StatusDisponivelId, NULL, GETDATE(), GETDATE(),
        0.00, 0.00, 0.00, 450000.00, 'IPTU-003-2025',
        -23.5505, -46.6500, 'Próximo ao metrô Consolação', @TipoPosseLocatarioId, 
        @TipoUsoResidencialId, 'Apartamento com 2 quartos, 1 suíte, varanda gourmet',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel 3
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelId3, 1, 1, 1, 1, 1, 1
    );
END
ELSE
BEGIN
    SELECT @ImovelId3 = Id FROM Imoveis WHERE Matricula = 'MAT-003-2025';
END

-- Imóvel 4: Imóvel comercial
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-004-2025')
BEGIN
    SET @ImovelId4 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelId4, 'MAT-004-2025', 'Av. Brigadeiro Faria Lima, 3000, Itaim Bibi', 200.00, 
        'Sala comercial em edifício corporativo', @TipoImovelComercialId, @FinalidadeComercialId,
        @StatusTransferidoId, NULL, GETDATE(), GETDATE(),
        0.00, 0.00, 0.00, 1200000.00, 'IPTU-004-2025',
        -23.5868, -46.6842, 'Próximo ao Shopping Iguatemi', @TipoPosseComodatoId, 
        @TipoUsoComercialId, 'Sala comercial com vista panorâmica, 4 vagas de garagem',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel 4
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelId4, 1, 1, 1, 1, 1, 1
    );
END
ELSE
BEGIN
    SELECT @ImovelId4 = Id FROM Imoveis WHERE Matricula = 'MAT-004-2025';
END

-- Imóvel 5: Propriedade rural
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-005-2025')
BEGIN
    SET @ImovelId5 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelId5, 'MAT-005-2025', 'Estrada Vicinal, Km 10, Zona Rural', 50000.00, 
        'Fazenda produtiva com casa sede', @TipoImovelRuralId, @FinalidadeRuralId,
        @StatusDisponivelId, NULL, GETDATE(), GETDATE(),
        50000.00, 0.00, 50000.00, 2000000.00, 'ITR-005-2025',
        -23.4000, -46.8000, 'Próximo ao Rio Grande', @TipoPosseProprietarioId, 
        @TipoUsoResidencialId, 'Fazenda com casa sede, curral, pasto formado e nascente',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel 5
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelId5, 1, 0, 1, 0, 0, 0
    );
END
ELSE
BEGIN
    SELECT @ImovelId5 = Id FROM Imoveis WHERE Matricula = 'MAT-005-2025';
END

-- Inserir imóveis secundários (desmembramentos do terreno principal)
DECLARE @ImovelSecundario1 UNIQUEIDENTIFIER;
DECLARE @ImovelSecundario2 UNIQUEIDENTIFIER;

-- Imóvel secundário 1: Lote desmembrado do terreno principal
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-001-A-2025')
BEGIN
    SET @ImovelSecundario1 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelSecundario1, 'MAT-001-A-2025', 'Rua das Flores, 123-A, Centro', 1000.00, 
        'Lote desmembrado para construção residencial', @TipoImovelTerrenoId, @FinalidadeResidencialId,
        @StatusDisponivelId, @ImovelId1, GETDATE(), GETDATE(),
        1000.00, 0.00, 1000.00, 200000.00, 'IPTU-001-A-2025',
        -23.5500, -46.6330, 'Esquina com Rua das Margaridas', @TipoPosseProprietarioId, 
        NULL, 'Lote em esquina, ideal para construção residencial',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel secundário 1
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelSecundario1, 1, 1, 1, 1, 1, 1
    );
END

-- Imóvel secundário 2: Outro lote desmembrado do terreno principal
IF NOT EXISTS (SELECT 1 FROM Imoveis WHERE Matricula = 'MAT-001-B-2025')
BEGIN
    SET @ImovelSecundario2 = NEWID();
    
    INSERT INTO Imoveis (
        Id, Matricula, Localizacao, AreaM2, Objeto, TipoImovelId, FinalidadeId, 
        StatusTransferenciaId, ImovelPaiId, DataCadastro, DataAtualizacao,
        AreaTerreno, AreaDesmembrada, AreaRemanescente, ValorVenal, RegistroIPTU,
        Latitude, Longitude, PontoReferencia, TipoPosseId, TipoUsoEdificacaoId, Observacao,
        UsuarioCadastroId, UsuarioAtualizacaoId
    )
    VALUES (
        @ImovelSecundario2, 'MAT-001-B-2025', 'Rua das Flores, 123-B, Centro', 1000.00, 
        'Lote desmembrado para construção comercial', @TipoImovelTerrenoId, @FinalidadeComercialId,
        @StatusEmTransferenciaId, @ImovelId1, GETDATE(), GETDATE(),
        1000.00, 0.00, 1000.00, 250000.00, 'IPTU-001-B-2025',
        -23.5510, -46.6335, 'Frente para avenida principal', @TipoPosseProprietarioId, 
        NULL, 'Lote com frente para avenida, ideal para comércio',
        @UsuarioId, @UsuarioId
    );
    
    -- Adicionar infraestrutura para o imóvel secundário 2
    INSERT INTO Infraestrutura (
        ImovelId, Agua, Esgoto, Energia, Pavimentacao, Iluminacao, ColetaLixo
    )
    VALUES (
        @ImovelSecundario2, 1, 1, 1, 1, 1, 1
    );
END

PRINT 'Dados de teste inseridos com sucesso!';
GO
