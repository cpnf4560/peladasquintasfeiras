# 🐘 CORREÇÃO POSTGRESQL - Gerar Equipas no Render

## 🎯 Problema

**Erro no Render (PostgreSQL):**
```
❌ Internal server error ao gerar equipas
```

**Funciona em Localhost (SQLite):**
```
✅ Gera equipas normalmente
```

## 🔍 Causa Raiz

### Diferenças SQL: PostgreSQL vs SQLite

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Placeholders** | `?` | `$1, $2, $3...` |
| **Arrays em WHERE** | `IN (?,?,?)` | `ANY($1::int[])` |
| **Extrair ano** | `substr(data, 1, 4)` | `EXTRACT(YEAR FROM data)` |
| **ROUND** | `ROUND(x, 2)` | `CAST(x AS DECIMAL(10,2))` |
| **Tipo data** | String | DATE/TIMESTAMP |

## ✅ Solução Implementada

### 1. Detecção Automática do Banco
```javascript
const isPostgres = !!process.env.DATABASE_URL;
```

### 2. Queries Separadas

#### PostgreSQL (Render)
```sql
SELECT 
  jog.id,
  jog.nome,
  COUNT(DISTINCT j.id) as jogos,
  COALESCE(SUM(CASE ... END), 0) as pontos_totais,
  COALESCE(CAST(
    (SUM(...) * 1.0) / NULLIF(COUNT(DISTINCT j.id), 0) AS DECIMAL(10,2)
  ), 0) as media_pontos
FROM jogadores jog
LEFT JOIN presencas p ON jog.id = p.jogador_id
LEFT JOIN jogos j ON p.jogo_id = j.id 
  AND EXTRACT(YEAR FROM CAST(j.data AS DATE)) = $1
WHERE jog.suspenso = 0 
  AND jog.id = ANY($2::int[])
GROUP BY jog.id, jog.nome
```

**Parâmetros:**
```javascript
queryParams = [anoAtual, idsConvocados];
// Exemplo: [2025, [1, 2, 3, 4, 5]]
```

#### SQLite (Localhost)
```sql
SELECT 
  jog.id,
  jog.nome,
  COUNT(DISTINCT j.id) as jogos,
  COALESCE(SUM(CASE ... END), 0) as pontos_totais,
  COALESCE(ROUND(
    (SUM(...) * 1.0) / NULLIF(COUNT(DISTINCT j.id), 0), 2
  ), 0) as media_pontos
FROM jogadores jog
LEFT JOIN presencas p ON jog.id = p.jogador_id
LEFT JOIN jogos j ON p.jogo_id = j.id 
  AND substr(j.data, 1, 4) = ?
WHERE jog.suspenso = 0 
  AND jog.id IN (?,?,?,?,?)
GROUP BY jog.id, jog.nome
```

**Parâmetros:**
```javascript
queryParams = [anoAtual.toString(), ...idsConvocados];
// Exemplo: ['2025', 1, 2, 3, 4, 5]
```

### 3. Mudanças Específicas PostgreSQL

#### a) Placeholders Numéricos
```javascript
// ❌ ANTES (SQLite)
WHERE jog.id IN (${idsConvocados.join(',')})  // SQL Injection!

// ✅ DEPOIS (PostgreSQL)
WHERE jog.id = ANY($2::int[])
```

#### b) Array de Inteiros
```javascript
// PostgreSQL espera array JavaScript
queryParams = [2025, [1, 2, 3, 4, 5]];
// db.js converte para $1 e $2::int[]
```

#### c) Extração de Ano
```sql
-- ❌ SQLite
substr(j.data, 1, 4) = '2025'

-- ✅ PostgreSQL
EXTRACT(YEAR FROM CAST(j.data AS DATE)) = 2025
```

#### d) Arredondamento
```sql
-- ❌ SQLite
ROUND(valor, 2)

-- ✅ PostgreSQL
CAST(valor AS DECIMAL(10,2))
```

## 📊 Fluxo Corrigido

```
1. Usuário clica "Gerar Equipas"
   ↓
2. Detectar banco: isPostgres = !!process.env.DATABASE_URL
   ↓
3a. SE PostgreSQL:
    - Query com $1, $2::int[]
    - Params: [ano, [ids]]
    - EXTRACT(YEAR FROM data)
    - CAST AS DECIMAL
   ↓
3b. SE SQLite:
    - Query com ?, ?, ?
    - Params: [ano, id1, id2, ...]
    - substr(data, 1, 4)
    - ROUND(valor, 2)
   ↓
4. Executar query apropriada
   ↓
5. Processar resultados (idêntico)
   ↓
6. Gerar equipas (idêntico)
   ↓
7. Renderizar (idêntico)
```

## 🧪 Como Testar

### 1. Localhost (SQLite)
```powershell
# Sem DATABASE_URL
npm start
# Testar em: http://localhost:3000/convocatoria
```

### 2. Render (PostgreSQL)
```powershell
# Com DATABASE_URL definido
# Deploy automático via GitHub
```

### 3. Verificar Logs

#### Localhost
```
=== GERANDO EQUIPAS EQUILIBRADAS ===
📋 10 convocados encontrados
Query: SELECT ... substr(j.data, 1, 4) = ? ... IN (?,?,?)
Params: ['2025', 1, 2, 3, ...]
✅ Equipas geradas com sucesso
```

#### Render
```
=== GERANDO EQUIPAS EQUILIBRADAS ===
📋 10 convocados encontrados
Query: SELECT ... EXTRACT(YEAR ...) = $1 ... ANY($2::int[])
Params: [2025, [1, 2, 3, ...]]
✅ Equipas geradas com sucesso
```

## 🛠️ Código Modificado

### routes/convocatoria.js

```javascript
// Detectar PostgreSQL vs SQLite
const isPostgres = !!process.env.DATABASE_URL;

let queryEstatisticas, queryParams;

if (isPostgres) {
  // PostgreSQL: $1, $2::int[], EXTRACT, CAST
  queryEstatisticas = `...`;
  queryParams = [anoAtual, idsConvocados];
} else {
  // SQLite: ?, IN, substr, ROUND
  const placeholders = idsConvocados.map(() => '?').join(',');
  queryEstatisticas = `... IN (${placeholders}) ...`;
  queryParams = [anoAtual.toString(), ...idsConvocados];
}

db.query(queryEstatisticas, queryParams, (err, estatisticas) => {
  // Processar resultados (idêntico para ambos)
});
```

## ⚠️ Problemas Comuns

### Erro: "operator does not exist: integer = integer[]"
**Causa:** Usando `jog.id IN ($1)` com array  
**Solução:** Usar `jog.id = ANY($1::int[])`

### Erro: "syntax error at or near '$'"
**Causa:** Mixing placeholders (? e $1)  
**Solução:** Escolher um estilo baseado em `isPostgres`

### Erro: "function round(numeric, integer) does not exist"
**Causa:** ROUND funciona diferente no PostgreSQL  
**Solução:** Usar `CAST(valor AS DECIMAL(10,2))`

### Erro: "invalid input syntax for type date"
**Causa:** Formato de data incompatível  
**Solução:** Usar `CAST(j.data AS DATE)` antes de EXTRACT

## 📝 Checklist de Deploy

- [x] Código detecta PostgreSQL vs SQLite
- [x] Query PostgreSQL usa $1, $2::int[]
- [x] Query SQLite usa ?, ?, ?
- [x] EXTRACT(YEAR) para PostgreSQL
- [x] substr() para SQLite
- [x] CAST AS DECIMAL para PostgreSQL
- [x] ROUND() para SQLite
- [x] Tratamento de erros atualizado
- [x] Logs incluem query e params
- [ ] Testar em localhost
- [ ] Commit + Push
- [ ] Deploy no Render
- [ ] Testar em produção

## 🚀 Deploy

```powershell
# 1. Commit
git add routes/convocatoria.js
git commit -m "fix: Compatibilidade PostgreSQL para gerar equipas"

# 2. Push
git push origin main

# 3. Aguardar deploy automático no Render (~2 minutos)

# 4. Testar em:
https://peladasquintasfeiras.onrender.com/convocatoria
```

## ✅ Validação Final

### Localhost (SQLite)
- [ ] Gera equipas sem erro
- [ ] Logs mostram query SQLite
- [ ] Params corretos: ['2025', 1, 2, ...]

### Render (PostgreSQL)
- [ ] Gera equipas sem erro
- [ ] Logs mostram query PostgreSQL
- [ ] Params corretos: [2025, [1, 2, ...]]

---

**Data:** 2025-10-20  
**Versão:** 2.0  
**Status:** ✅ PRONTO PARA DEPLOY
