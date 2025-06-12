-- Script para adicionar um usuário administrador
-- Verifica se as tabelas necessárias existem
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios') AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Cargos')
BEGIN
    PRINT 'Tabelas Usuarios e Cargos encontradas. Adicionando administrador...';
    
    -- Verificar se já existe um administrador com o nome de usuário 'admin'
    IF NOT EXISTS (SELECT * FROM Usuarios WHERE NomeUsuario = 'admin')
    BEGIN
        -- Obter o ID do cargo de Administrador
        DECLARE @AdminCargoId UNIQUEIDENTIFIER;
        
        SELECT @AdminCargoId = Id FROM Cargos WHERE Nome = 'Administrador';
        
        IF @AdminCargoId IS NOT NULL
        BEGIN
            -- Inserir o usuário administrador
            -- Senha: admin123 (na implementação real, esta senha seria criptografada)
            -- Nota: No sistema real, a senha será criptografada pelo backend usando bcrypt
            INSERT INTO Usuarios (Nome, NomeUsuario, Senha, CargoId, Ativo)
            VALUES ('Administrador do Sistema', 'admin', 'admin123', @AdminCargoId, 1);
            
            PRINT 'Usuário administrador criado com sucesso!';
            PRINT 'Nome de usuário: admin';
            PRINT 'Senha: admin123';
        END
        ELSE
        BEGIN
            PRINT 'Erro: Cargo de Administrador não encontrado. Criando cargo...';
            
            -- Criar o cargo de Administrador se não existir
            INSERT INTO Cargos (Nome, Descricao)
            VALUES ('Administrador', 'Acesso total ao sistema');
            
            -- Obter o ID do cargo recém-criado
            SELECT @AdminCargoId = Id FROM Cargos WHERE Nome = 'Administrador';
            
            -- Inserir o usuário administrador
            INSERT INTO Usuarios (Nome, NomeUsuario, Senha, CargoId, Ativo)
            VALUES ('Administrador do Sistema', 'admin', 'admin123', @AdminCargoId, 1);
            
            PRINT 'Cargo de Administrador e usuário admin criados com sucesso!';
            PRINT 'Nome de usuário: admin';
            PRINT 'Senha: admin123';
        END
    END
    ELSE
    BEGIN
        PRINT 'Usuário administrador já existe. Atualizando senha...';
        
        -- Atualizar a senha do administrador existente
        UPDATE Usuarios
        SET Senha = 'admin123', 
            Ativo = 1,
            DataAtualizacao = GETDATE()
        WHERE NomeUsuario = 'admin';
        
        PRINT 'Senha do administrador atualizada com sucesso!';
        PRINT 'Nome de usuário: admin';
        PRINT 'Senha: admin123';
    END
END
ELSE
BEGIN
    PRINT 'Erro: Tabelas Usuarios e/ou Cargos não encontradas.';
    PRINT 'Execute primeiro o script de criação das tabelas.';
END

-- Listar todos os usuários após a operação
SELECT 
    u.Id, 
    u.Nome, 
    u.NomeUsuario, 
    c.Nome AS Cargo, 
    u.Ativo, 
    u.DataCriacao, 
    u.UltimoLogin
FROM 
    Usuarios u
    INNER JOIN Cargos c ON u.CargoId = c.Id
ORDER BY 
    u.DataCriacao DESC;
