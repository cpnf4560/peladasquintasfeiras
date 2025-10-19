-- ========================================
-- ADICIONAR JOGADORES FALTANTES NO RENDER
-- ========================================
-- Execute isto no Render Dashboard > PostgreSQL > Query
-- https://dashboard.render.com/

-- 1. Verificar quantos jogadores existem
SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0;

-- 2. Ver todos os jogadores atuais (ordem alfabética)
SELECT nome FROM jogadores WHERE COALESCE(suspenso, 0) = 0 ORDER BY nome;

-- 3. ADICIONAR OS 2 JOGADORES FALTANTES
-- (Execute apenas se não existirem)

-- Verificar se Filipe Garcês existe
SELECT * FROM jogadores WHERE nome = 'Filipe Garcês';

-- Se não existir, adicionar:
INSERT INTO jogadores (nome, suspenso) 
VALUES ('Filipe Garcês', 0)
ON CONFLICT (nome) DO NOTHING;

-- Verificar se Leonardo Sousa existe
SELECT * FROM jogadores WHERE nome = 'Leonardo Sousa';

-- Se não existir, adicionar:
INSERT INTO jogadores (nome, suspenso) 
VALUES ('Leonardo Sousa', 0)
ON CONFLICT (nome) DO NOTHING;

-- 4. VERIFICAR RESULTADO FINAL
SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0;
-- Deve retornar: 20

-- 5. ADICIONAR À CONVOCATÓRIA
-- Buscar IDs dos jogadores recém-adicionados
SELECT id, nome FROM jogadores WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- Verificar se já estão na convocatória
SELECT c.*, j.nome 
FROM convocatoria c 
JOIN jogadores j ON c.jogador_id = j.id 
WHERE j.nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- Se não estiverem, adicionar como reservas
-- Buscar a última posição de reserva
SELECT MAX(posicao) as ultima_posicao FROM convocatoria WHERE tipo = 'reserva';

-- Adicionar Filipe Garcês (substitua XXX pelo ID real)
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 9, 0 
FROM jogadores 
WHERE nome = 'Filipe Garcês'
  AND NOT EXISTS (
    SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id
  );

-- Adicionar Leonardo Sousa (substitua YYY pelo ID real)
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 10, 0 
FROM jogadores 
WHERE nome = 'Leonardo Sousa'
  AND NOT EXISTS (
    SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id
  );

-- 6. VERIFICAÇÃO FINAL
-- Total na convocatória
SELECT tipo, COUNT(*) as total 
FROM convocatoria 
GROUP BY tipo 
ORDER BY tipo;
-- Deve retornar: convocado: 10, reserva: 10

-- Ver todas as reservas
SELECT c.posicao, j.nome 
FROM convocatoria c 
JOIN jogadores j ON c.jogador_id = j.id 
WHERE c.tipo = 'reserva' 
ORDER BY c.posicao;

-- ========================================
-- SCRIPTS ALTERNATIVOS (se o acima não funcionar)
-- ========================================

-- Deletar e recriar convocatória (CUIDADO!)
-- Apenas use se houver problemas graves

-- BACKUP primeiro!
-- CREATE TABLE convocatoria_backup AS SELECT * FROM convocatoria;

-- Depois:
-- DELETE FROM convocatoria;
-- INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
-- SELECT id, 
--        CASE WHEN ROW_NUMBER() OVER (ORDER BY nome) <= 10 THEN 'convocado' ELSE 'reserva' END,
--        ROW_NUMBER() OVER (ORDER BY nome),
--        0
-- FROM jogadores
-- WHERE COALESCE(suspenso, 0) = 0;

-- ========================================
-- LISTA COMPLETA DOS 20 JOGADORES (referência)
-- ========================================
/*
1. Carlos Correia
2. Carlos Silva
3. Césaro Cruz
4. Filipe Garcês     ← PODE FALTAR
5. Flávio Silva
6. Hugo Belga
7. Ismael Campos
8. João Couto
9. Joel Almeida
10. Joaquim Rocha
11. Leonardo Sousa   ← PODE FALTAR
12. Manuel Rocha
13. Nuno Ferreira
14. Paulo Pinto
15. Pedro Lopes
16. Ricardo Sousa
17. Rogério Silva
18. Rui Lopes
19. Serafim Sousa
20. Valter Pinho
*/
