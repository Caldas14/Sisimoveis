-- Script para adicionar um usuário administrador padrão
-- Executar este script após criar a tabela de usuários

-- Verificar se o cargo de Administrador existe
IF NOT EXISTS (SELECT * FROM Cargos WHERE Nome = 'Administrador')
BEGIN
    -- Inserir cargo de Administrador se não existir
    INSERT INTO Cargos (Nome, Descricao)
    VALUES ('Administrador', 'Acesso total ao sistema');
END

-- Obter o ID do cargo de Administrador
DECLARE @CargoAdminId UNIQUEIDENTIFIER;
SELECT @CargoAdminId = Id FROM Cargos WHERE Nome = 'Administrador';

-- Verificar se já existe um usuário administrador
IF NOT EXISTS (SELECT * FROM Usuarios WHERE NomeUsuario = 'admin')
BEGIN
    -- Inserir usuário administrador padrão
    -- Senha: admin123 (na implementação real, usaríamos hash)
    INSERT INTO Usuarios (
        Id, 
        Nome, 
        NomeUsuario, 
        Senha, 
        CargoId, 
        Ativo, 
        DataCriacao, 
        DataAtualizacao
    )
    VALUES (
        NEWID(), 
        'Administrador', 
        'admin', 
        'admin123', 
        @CargoAdminId, 
        1, 
        GETDATE(), 
        GETDATE()
    );
    
    PRINT 'Usuário administrador padrão criado com sucesso.';
END
ELSE
BEGIN
    PRINT 'Usuário administrador já existe.';
END
