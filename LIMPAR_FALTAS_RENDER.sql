-- ========================================
-- LIMPAR CONTAGEM DE FALTAS
-- ========================================
-- Execute no Render Dashboard > PostgreSQL > Query

-- 1. Verificar total de faltas antes
SELECT COUNT(*) as total_faltas FROM faltas_historico;

-- 2. Ver algumas faltas (opcional)
SELECT f.*, j.nome 
FROM faltas_historico f
JOIN jogadores j ON f.jogador_id = j.id
ORDER BY f.data DESC
LIMIT 10;

-- 3. LIMPAR TODAS AS FALTAS
DELETE FROM faltas_historico;

-- 4. Verificar resultado (deve retornar 0)
SELECT COUNT(*) as total_faltas FROM faltas_historico;

-- 5. Verificar convocatória (todos devem ter 0 faltas)
SELECT j.nome, 
       COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
FROM jogadores j
WHERE COALESCE(j.suspenso, 0) = 0
ORDER BY j.nome;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- Todos os jogadores devem ter: total_faltas = 0
