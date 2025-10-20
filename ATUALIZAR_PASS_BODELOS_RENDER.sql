-- ============================================
-- ATUALIZAR PASSWORD DO PRESIDENTE NO RENDER
-- ============================================
-- Nova password: bodelos
-- Executar este SQL no PostgreSQL do Render
-- ============================================

UPDATE users 
SET password = '$2b$10$RwUCZhuYhPsqcNsMyz8g6ee992NKBT4KOihedr4zMG4YWQrqDrxZi' 
WHERE username = 'presidente';

-- Verificar se foi atualizado
SELECT username, password 
FROM users 
WHERE username = 'presidente';
