-- Script para verificar as colunas específicas na tabela Imoveis
-- Este script é mais simples e focado apenas nas colunas que precisamos para o endpoint PUT

-- Verificar se a tabela Imoveis existe
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Imoveis')
BEGIN
    PRINT 'Tabela Imoveis encontrada. Verificando colunas...';
    
    -- Listar todas as colunas da tabela Imoveis
    SELECT 
        COLUMN_NAME, 
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM 
        INFORMATION_SCHEMA.COLUMNS
    WHERE 
        TABLE_NAME = 'Imoveis'
    ORDER BY 
        ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT 'Tabela Imoveis não encontrada no banco de dados.';
END

-- Verificar se a tabela InfraestruturaImoveis existe
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Usuários')
BEGIN
    PRINT 'Tabela InfraestruturaImoveis encontrada. Verificando colunas...';
    
    -- Listar todas as colunas da tabela InfraestruturaImoveis
    SELECT 
        COLUMN_NAME, 
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM 
        INFORMATION_SCHEMA.COLUMNS
    WHERE 
        TABLE_NAME = 'Usuários'
    ORDER BY 
        ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT 'Tabela InfraestruturaImoveis não encontrada no banco de dados.';
END
