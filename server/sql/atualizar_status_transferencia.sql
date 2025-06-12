-- Script para atualizar a tabela StatusTransferencia com novos valores
-- Este script adiciona os novos status que estão sendo usados no frontend

-- Verificar se os novos status já existem
IF NOT EXISTS (SELECT 1 FROM StatusTransferencia WHERE Nome LIKE '%Regularizado%')
BEGIN
    INSERT INTO StatusTransferencia (Nome, Descricao) 
    VALUES ('Regularizado', 'Imóvel com status regularizado');
    PRINT 'Status "Regularizado" adicionado.';
END
ELSE
    PRINT 'Status "Regularizado" já existe.';

IF NOT EXISTS (SELECT 1 FROM StatusTransferencia WHERE Nome LIKE '%Pendente%')
BEGIN
    INSERT INTO StatusTransferencia (Nome, Descricao) 
    VALUES ('Pendente', 'Imóvel com status pendente');
    PRINT 'Status "Pendente" adicionado.';
END
ELSE
    PRINT 'Status "Pendente" já existe.';

IF NOT EXISTS (SELECT 1 FROM StatusTransferencia WHERE Nome LIKE '%Não Aplicável%')
BEGIN
    INSERT INTO StatusTransferencia (Nome, Descricao) 
    VALUES ('Não Aplicável', 'Status não aplicável a este imóvel');
    PRINT 'Status "Não Aplicável" adicionado.';
END
ELSE
    PRINT 'Status "Não Aplicável" já existe.';

-- Listar todos os status disponíveis após a atualização
SELECT Id, Nome, Descricao FROM StatusTransferencia ORDER BY Nome;
