-- Adicionar Filipe Garcês e Leonardo Sousa à convocatória
-- Execute este script no SQLite

-- 1. Verificar IDs dos jogadores
SELECT id, nome FROM jogadores WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- 2. Verificar se já estão na convocatória
SELECT c.*, j.nome 
FROM convocatoria c
JOIN jogadores j ON c.jogador_id = j.id
WHERE j.nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- 3. Ver última posição de reserva
SELECT MAX(posicao) as ultima_posicao FROM convocatoria WHERE tipo = 'reserva';

-- 4. Adicionar Filipe Garcês (se não estiver)
INSERT OR IGNORE INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 
  (SELECT COALESCE(MAX(posicao), 0) + 1 FROM convocatoria WHERE tipo = 'reserva'),
  0
FROM jogadores 
WHERE nome = 'Filipe Garcês'
  AND NOT EXISTS (SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id);

-- 5. Adicionar Leonardo Sousa (se não estiver)
INSERT OR IGNORE INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva',
  (SELECT COALESCE(MAX(posicao), 0) + 1 FROM convocatoria WHERE tipo = 'reserva'),
  0
FROM jogadores 
WHERE nome = 'Leonardo Sousa'
  AND NOT EXISTS (SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id);

-- 6. Verificar resultado
SELECT tipo, COUNT(*) as total 
FROM convocatoria 
GROUP BY tipo;

-- 7. Listar todos
SELECT c.posicao, j.nome, c.tipo
FROM convocatoria c
JOIN jogadores j ON c.jogador_id = j.id
ORDER BY c.tipo, c.posicao;
