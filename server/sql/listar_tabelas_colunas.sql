-- Script para listar todas as tabelas e colunas do banco de dados

-- Listar todas as tabelas do banco de dados
SELECT 
    t.name AS TableName,
    SCHEMA_NAME(schema_id) AS SchemaName
FROM 
    sys.tables t
ORDER BY 
    SchemaName, TableName;

-- Listar todas as colunas da tabela Imoveis com seus tipos de dados
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.precision AS Precision,
    c.scale AS Scale,
    c.is_nullable AS IsNullable,
    ISNULL(ep.value, '') AS Description
FROM 
    sys.columns c
JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN 
    sys.extended_properties ep ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
WHERE 
    c.object_id = OBJECT_ID('Imoveis')
ORDER BY 
    c.column_id;

-- Listar todas as colunas da tabela InfraestruturaImoveis com seus tipos de dados
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.precision AS Precision,
    c.scale AS Scale,
    c.is_nullable AS IsNullable,
    ISNULL(ep.value, '') AS Description
FROM 
    sys.columns c
JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN 
    sys.extended_properties ep ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
WHERE 
    c.object_id = OBJECT_ID('InfraestruturaImoveis')
ORDER BY 
    c.column_id;

-- Listar todas as chaves estrangeiras
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTableName,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumnName
FROM 
    sys.foreign_keys AS fk
INNER JOIN 
    sys.foreign_key_columns AS fkc ON fk.OBJECT_ID = fkc.constraint_object_id
ORDER BY 
    TableName, ColumnName;
