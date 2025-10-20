-- ========================================
-- ATUALIZAR PASSWORD DO PRESIDENTE
-- ========================================
-- Password nova: bodelos
-- Hash bcrypt gerado: $2b$10$wn9VjN2x3vFuQcpyRfD5P.LiB/int4H5VuFs0Jxd/2/TtSjV8LTJu

-- EXECUTE NO RENDER SHELL:
-- 1. Aceder ao serviço no Render
-- 2. Clicar em "Shell"
-- 3. Executar: psql $DATABASE_URL
-- 4. Copiar e colar o comando abaixo:

UPDATE users 
SET password = '$2b$10$wn9VjN2x3vFuQcpyRfD5P.LiB/int4H5VuFs0Jxd/2/TtSjV8LTJu' 
WHERE username = 'presidente';

-- Verificar a alteração:
SELECT username, role, created_at FROM users WHERE username = 'presidente';

-- ========================================
-- NOVAS CREDENCIAIS:
-- ========================================
-- Utilizador: presidente
-- Password: bodelos
-- ========================================
