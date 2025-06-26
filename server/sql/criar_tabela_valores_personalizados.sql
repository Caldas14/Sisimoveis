-- Criação da tabela para valores personalizados
CREATE TABLE ValoresPersonalizados (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Categoria VARCHAR(50) NOT NULL, -- 'Finalidade', 'TipoImovel', 'TipoUsoEdificacao', 'TipoPosse', 'StatusTransferencia'
    Valor VARCHAR(100) NOT NULL,
    DataCriacao DATETIME DEFAULT GETDATE(),
    UsuarioCriacao VARCHAR(100),
    CONSTRAINT UC_ValorCategoria UNIQUE (Categoria, Valor) -- Evitar duplicações
);

-- Índices para otimizar consultas
CREATE INDEX IX_ValoresPersonalizados_Categoria ON ValoresPersonalizados(Categoria);
