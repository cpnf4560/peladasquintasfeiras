# Correções para Produção (PostgreSQL/Render)

## Problemas Identificados e Resolvidos

### 1. ❌ Erro ao registar resultado: "Erro ao obter ID do jogo"

**Causa:** O código estava a usar `this.lastID` (específico do SQLite) que não funciona em PostgreSQL.

**Solução:**
- Adicionado `RETURNING id` à query de INSERT em `routes/jogos.js`
- Melhorado o wrapper PostgreSQL em `db.js` para detectar queries com RETURNING
- Adicionada extração de ID compatível com ambos os DBs: `result?.rows?.[0]?.id || result?.[0]?.id || this?.lastID`

### 2. ❌ Estatísticas não aparecem

**Causa Provável:** 
- Queries podem estar a retornar dados mas não no formato esperado
- Possível problema com conversão de tipos (ROUND, etc) no PostgreSQL

**Solução:**
- Adicionados logs detalhados em `routes/estatisticas.js`
- O wrapper PostgreSQL agora distingue corretamente SELECT vs INSERT RETURNING
- Logs mostrarão quantos jogadores foram encontrados

### 3. ❌ Histórico de resultados vazio

**Causa Provável:**
- Bug no wrapper `db.js` que usava `.get()` em vez de `.all()` para queries com JOIN
- Wrapper PostgreSQL não estava a retornar rows corretamente

**Solução:**
- Corrigido wrapper SQLite para usar `.all()` em queries com JOIN
- Wrapper PostgreSQL agora retorna sempre array de rows para SELECT e INSERT...RETURNING
- Adicionados logs em `routes/jogos.js` para debug

## Alterações nos Ficheiros

### `db.js`
```javascript
// PostgreSQL wrapper agora detecta RETURNING
const isReturning = /RETURNING/i.test(text);
if (isSelect || isReturning) {
  callback(err, res ? res.rows : []);
}

// SQLite wrapper corrigido para não usar .get() em JOINs
if (/LIMIT 1/.test(text) && !/JOIN/i.test(text) && ...) {
  sqliteDb.get(...); // apenas para casos muito específicos
} else {
  sqliteDb.all(...); // para a maioria das queries
}
```

### `routes/jogos.js`
```javascript
// INSERT com RETURNING para PostgreSQL
'INSERT INTO jogos (...) VALUES (...) RETURNING id'

// Extração de ID compatível com ambos
const jogoId = result?.rows?.[0]?.id || result?.[0]?.id || this?.lastID;

// Logs detalhados em todas as operações
console.log('📝 Registando novo jogo:', ...);
console.log('✅ Jogo inserido com ID:', jogoId);
```

### `routes/estatisticas.js`
- Adicionados logs para debug de filtros e resultados
- Mantida compatibilidade com gerarCuriosidades

## Como Verificar no Render

1. **Após deploy**, acede aos logs do Render e procura por:
   - `📝 Registando novo jogo:` - confirma que dados chegam
   - `✅ Jogo inserido com ID:` - confirma que ID foi obtido
   - `📊 Estatísticas solicitadas:` - filtros aplicados
   - `✅ Estatísticas encontradas:` - número de jogadores

2. **Se continuar com problemas:**
   - Verifica se o DATABASE_URL está correto (deve ser pooler connection)
   - Confirma que as tabelas existem no PostgreSQL
   - Verifica os logs para ver mensagens de erro específicas

3. **Teste de INSERT:**
   - Regista um novo jogo
   - Verifica nos logs se aparece "✅ Jogo inserido com ID: <número>"
   - Se não aparecer número, há problema com RETURNING

4. **Teste de SELECT:**
   - Acede ao histórico
   - Deve aparecer "✅ Jogos encontrados: <número>"
   - Se for 0, não há jogos na BD PostgreSQL

## Comandos Úteis para Debug Remoto

Se tiveres acesso à BD PostgreSQL do Render:

```sql
-- Verificar jogos
SELECT COUNT(*) FROM jogos;
SELECT * FROM jogos ORDER BY id DESC LIMIT 5;

-- Verificar presenças
SELECT COUNT(*) FROM presencas;
SELECT jogo_id, COUNT(*) FROM presencas GROUP BY jogo_id ORDER BY jogo_id DESC;

-- Verificar jogadores
SELECT COUNT(*) FROM jogadores WHERE suspenso = 0;
```

## Próximos Passos

1. Aguarda o deploy automático no Render
2. Tenta registar um novo jogo
3. Verifica os logs do Render para confirmar que o ID foi obtido
4. Acede às estatísticas e histórico
5. Se continuar com problemas, copia os logs e partilha
