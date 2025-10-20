-- ====================================
-- CRIAR UTILIZADORES NO RENDER
-- Execute este SQL diretamente no PostgreSQL do Render
-- ====================================

-- 1. Limpar utilizadores antigos (CUIDADO!)
DELETE FROM users;

-- 2. Inserir utilizador "presidente"
-- Password: Bodelos123*
INSERT INTO users (username, password, role, created_at) 
VALUES (
  'presidente', 
  '$2b$10$xN5KqVQY8EhZXzJ6qF.vJO5YW7hGmP.HQF5pKnF5Vz8qW7lF5Vz8q',
  'admin',
  NOW()
);

-- 3. Inserir utilizador "admin"  
-- Password: rzq7xgq8
INSERT INTO users (username, password, role, created_at) 
VALUES (
  'admin',
  '$2b$10$yM6LrWRZ9FiYXzK7rG.wKP6ZX8iHnQ.IRG6rLoG6Wz9rX8mG6Wz9r',
  'admin',
  NOW()
);

-- 4. Verificar utilizadores criados
SELECT username, role, created_at FROM users ORDER BY username;

-- ====================================
-- RESULTADO ESPERADO:
-- username   | role  | created_at
-- -----------+-------+-------------------
-- admin      | admin | 2025-01-20 ...
-- presidente | admin | 2025-01-20 ...
-- ====================================

-- NOTA: Os hashes acima são EXEMPLOS
-- Para hashes corretos, use o script setup_render_users.js
