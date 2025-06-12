-- Adicionar campo MatriculasOriginadas à tabela Imoveis
ALTER TABLE Imoveis
ADD MatriculasOriginadas NVARCHAR(500) NULL;

-- Comentário para documentação
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Matrículas originadas deste imóvel, separadas por vírgula',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Imoveis',
    @level2type = N'COLUMN', @level2name = N'MatriculasOriginadas';
