-- Verificar se a tabela DocumentosImoveis existe, se não, criar
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DocumentosImoveis')
BEGIN
  CREATE TABLE DocumentosImoveis (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ImovelId UNIQUEIDENTIFIER NOT NULL,
    CaminhoDocumento NVARCHAR(500) NOT NULL,
    NomeDocumento NVARCHAR(255) NOT NULL,
    TipoDocumento NVARCHAR(100),
    DataCadastro DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ImovelId) REFERENCES Imoveis(Id)
  )
END
