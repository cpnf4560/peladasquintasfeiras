# ======================================
# GUIA: ADICIONAR JOGADORES NO RENDER
# ======================================

## SITUAÇÃO ATUAL
- **Esperado:** 20 jogadores no total
- **Localhost:** 18 jogadores (faltam Filipe Garcês e Leonardo Sousa)
- **Render:** Número a verificar

## SOLUÇÃO RÁPIDA - LOCALHOST

### Opção 1: Duplo Clique
1. Abrir a pasta do projeto
2. Duplo clique em **`ADICIONAR_JOGADORES.bat`**
3. Verificar que foram adicionados

### Opção 2: Linha de Comando
```bash
node add_missing_players.js
```

---

## SOLUÇÃO - RENDER (PostgreSQL)

### 1. Aceder ao Render Dashboard
- URL: https://dashboard.render.com/
- Login com suas credenciais

### 2. Aceder ao PostgreSQL
1. Dashboard > PostgreSQL (seu banco de dados)
2. Tab **"Query"** ou **"Connect"**

### 3. Verificar Jogadores Atuais
Execute esta query:

```sql
-- Ver total de jogadores
SELECT COUNT(*) as total 
FROM jogadores 
WHERE COALESCE(suspenso, 0) = 0;

-- Ver todos os nomes (ordem alfabética)
SELECT nome 
FROM jogadores 
WHERE COALESCE(suspenso, 0) = 0 
ORDER BY nome;
```

### 4. Adicionar Jogadores Faltantes

#### Se faltarem Filipe Garcês e Leonardo Sousa:

```sql
-- Adicionar Filipe Garcês
INSERT INTO jogadores (nome, suspenso) 
VALUES ('Filipe Garcês', 0)
ON CONFLICT (nome) DO NOTHING;

-- Adicionar Leonardo Sousa
INSERT INTO jogadores (nome, suspenso) 
VALUES ('Leonardo Sousa', 0)
ON CONFLICT (nome) DO NOTHING;
```

### 5. Adicionar à Convocatória

```sql
-- Obter IDs dos novos jogadores
SELECT id, nome 
FROM jogadores 
WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- Verificar última posição de reserva
SELECT MAX(posicao) as ultima_posicao 
FROM convocatoria 
WHERE tipo = 'reserva';

-- Adicionar Filipe Garcês como reserva
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 9, 0 
FROM jogadores 
WHERE nome = 'Filipe Garcês'
  AND NOT EXISTS (
    SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id
  );

-- Adicionar Leonardo Sousa como reserva
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 10, 0 
FROM jogadores 
WHERE nome = 'Leonardo Sousa'
  AND NOT EXISTS (
    SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id
  );
```

### 6. Verificação Final

```sql
-- Total de jogadores (deve ser 20)
SELECT COUNT(*) as total 
FROM jogadores 
WHERE COALESCE(suspenso, 0) = 0;

-- Total na convocatória por tipo (10 convocados + 10 reservas)
SELECT tipo, COUNT(*) as total 
FROM convocatoria 
GROUP BY tipo 
ORDER BY tipo;

-- Ver todas as reservas
SELECT c.posicao, j.nome 
FROM convocatoria c 
JOIN jogadores j ON c.jogador_id = j.id 
WHERE c.tipo = 'reserva' 
ORDER BY c.posicao;
```

---

## LISTA COMPLETA DOS 20 JOGADORES

1. Carlos Correia
2. Carlos Silva
3. Césaro Cruz
4. **Filipe Garcês** ⚠️
5. Flávio Silva
6. Hugo Belga
7. Ismael Campos
8. João Couto
9. Joel Almeida
10. Joaquim Rocha
11. **Leonardo Sousa** ⚠️
12. Manuel Rocha
13. Nuno Ferreira
14. Paulo Pinto
15. Pedro Lopes
16. Ricardo Sousa
17. Rogério Silva
18. Rui Lopes
19. Serafim Sousa
20. Valter Pinho

⚠️ = Jogadores que podem estar em falta

---

## SINCRONIZAÇÃO APÓS CORRIGIR NO RENDER

Depois de adicionar os jogadores no Render:

### Windows (Duplo Clique)
```
SYNC.bat
```

### Ou Linha de Comando
```bash
node sync_from_render.js
```

---

## VERIFICAÇÃO COMPLETA

Execute localmente após sincronizar:

```bash
node verificar_jogadores_completo.js
```

Deve mostrar:
- ✅ 20 jogadores no total
- ✅ Todos os nomes listados
- ✅ Sem jogadores faltantes

---

## TROUBLESHOOTING

### Erro: "duplicate key value violates unique constraint"
Os jogadores já existem no banco. Execute apenas as queries de verificação.

### Erro: "column nome does not exist"
Verifique se a tabela `jogadores` está corretamente criada.

### Convocatória não mostra todos
Execute no Render:
```sql
-- Ver quantos estão na convocatória
SELECT COUNT(*) FROM convocatoria;

-- Se faltarem, resetar (CUIDADO!)
DELETE FROM convocatoria;

INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT 
  id, 
  CASE WHEN ROW_NUMBER() OVER (ORDER BY nome) <= 10 
    THEN 'convocado' 
    ELSE 'reserva' 
  END as tipo,
  ROW_NUMBER() OVER (ORDER BY nome) as posicao,
  0 as confirmado
FROM jogadores
WHERE COALESCE(suspenso, 0) = 0;
```

---

## RESUMO DOS PASSOS

### LOCALHOST ✅
1. ✅ Duplo clique em `ADICIONAR_JOGADORES.bat`
2. ✅ Verificar com `verificar_jogadores_completo.js`

### RENDER 🔧
1. 🔧 Aceder ao Render Dashboard
2. 🔧 Executar queries de adição (secção 4 e 5)
3. 🔧 Verificar resultado (secção 6)
4. 🔧 Sincronizar com `SYNC.bat`

### VALIDAÇÃO FINAL ✅
- Aceder à aplicação no Render
- Ir para `/convocatoria`
- Verificar que aparecem todos os 20 jogadores
- Confirmar que não há mensagens de "jogadores faltantes"

---

**Ficheiros Criados:**
- ✅ `add_missing_players.js` - Script automático para localhost
- ✅ `ADICIONAR_JOGADORES.bat` - Batch para duplo clique
- ✅ `ADD_PLAYERS_RENDER.sql` - Queries para Render (já existente)
- ✅ Este guia (`ADD_PLAYERS_GUIDE.md`)

**Criado em:** ${new Date().toLocaleString('pt-PT')}
