-- Configurar ordem dos coletes conforme definido no WhatsApp
-- Outubro de 2025

-- 1. Limpar convocatória atual
DELETE FROM convocatoria;

-- 2. Limpar histórico de coletes
DELETE FROM coletes;

-- 3. Inserir ordem dos convocados (TOP 10 - podem levar coletes)
-- Ordem: Rogério, Cesaro, Carlos S., Nuno, Joel, Carlos C., Joaquim, Ismael, João, Rui

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 1, 'convocado' FROM jogadores WHERE nome LIKE '%Rogério%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 2, 'convocado' FROM jogadores WHERE nome LIKE '%Cesaro%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 3, 'convocado' FROM jogadores WHERE nome LIKE '%Carlos%Silva%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 4, 'convocado' FROM jogadores WHERE nome LIKE '%Nuno%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 5, 'convocado' FROM jogadores WHERE nome LIKE '%Joel%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 6, 'convocado' FROM jogadores WHERE nome LIKE '%Carlos%Cruz%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 7, 'convocado' FROM jogadores WHERE nome LIKE '%Joaquim%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 8, 'convocado' FROM jogadores WHERE nome LIKE '%Ismael%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 9, 'convocado' FROM jogadores WHERE nome LIKE '%João%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 10, 'convocado' FROM jogadores WHERE nome LIKE '%Rui%' LIMIT 1;

-- 4. Inserir reservas (restantes)
INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 11, 'reserva' FROM jogadores WHERE nome LIKE '%Ricardo%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 12, 'reserva' FROM jogadores WHERE nome LIKE '%Valter%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 13, 'reserva' FROM jogadores WHERE nome LIKE '%Serafim%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 14, 'reserva' FROM jogadores WHERE nome LIKE '%Hugo%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 15, 'reserva' FROM jogadores WHERE nome LIKE '%Paulo%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 16, 'reserva' FROM jogadores WHERE nome LIKE '%Flávio%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 17, 'reserva' FROM jogadores WHERE nome LIKE '%Manuel%' LIMIT 1;

INSERT INTO convocatoria (jogador_id, posicao, tipo)
SELECT id, 18, 'reserva' FROM jogadores WHERE nome LIKE '%Pedro%' LIMIT 1;

-- 5. Inserir histórico de coletes

-- Rogério levou em 02/10, devolveu em 09/10
INSERT INTO coletes (jogador_id, data_levou, data_devolveu)
SELECT id, '2025-10-02', '2025-10-09' FROM jogadores WHERE nome LIKE '%Rogério%' LIMIT 1;

-- Cesaro levou em 09/10, devolveu em 16/10
INSERT INTO coletes (jogador_id, data_levou, data_devolveu)
SELECT id, '2025-10-09', '2025-10-16' FROM jogadores WHERE nome LIKE '%Cesaro%' LIMIT 1;

-- Carlos Silva tem atualmente desde 16/10
INSERT INTO coletes (jogador_id, data_levou, data_devolveu)
SELECT id, '2025-10-16', NULL FROM jogadores WHERE nome LIKE '%Carlos%Silva%' LIMIT 1;

-- Verificação
SELECT 'CONVOCATÓRIA:' as tipo;
SELECT c.posicao, c.tipo, j.nome
FROM convocatoria c
JOIN jogadores j ON c.jogador_id = j.id
ORDER BY c.posicao ASC;

SELECT 'HISTÓRICO DE COLETES:' as tipo;
SELECT j.nome, c.data_levou, c.data_devolveu
FROM coletes c
JOIN jogadores j ON c.jogador_id = j.id
ORDER BY c.data_levou ASC;
