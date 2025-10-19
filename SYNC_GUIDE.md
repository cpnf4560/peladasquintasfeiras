# 🔄 SINCRONIZAR DADOS RENDER → LOCALHOST

**Problema:** Localhost (SQLite) tem 18 jogadores, mas Render (PostgreSQL) tem 20.

**Jogadores faltantes:**
- ❌ Filipe Garcês
- ❌ Leonardo Sousa

---

## 🚀 SOLUÇÃO AUTOMÁTICA

### Opção 1: Script Node.js
```bash
node sync_from_render.js
```

### Opção 2: Batch File (duplo clique)
```
SYNC.bat
```

---

## ✋ SOLUÇÃO MANUAL (SQL)

Se preferires fazer manualmente:

### 1. Adicionar Jogadores Faltantes
```sql
-- Adicionar Filipe Garcês
INSERT INTO jogadores (nome, suspenso) VALUES ('Filipe Garcês', 0);

-- Adicionar Leonardo Sousa
INSERT INTO jogadores (nome, suspenso) VALUES ('Leonardo Sousa', 0);
```

### 2. Adicionar à Convocatória (como reservas)
```sql
-- Buscar os IDs dos jogadores recém-adicionados
SELECT id, nome FROM jogadores WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- Adicionar à convocatória (substitui XXX e YYY pelos IDs)
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) 
VALUES (XXX, 'reserva', 10, 0);

INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) 
VALUES (YYY, 'reserva', 11, 0);
```

### 3. Verificar
```sql
-- Total de jogadores
SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0;
-- Deve retornar: 20

-- Convocatória
SELECT tipo, COUNT(*) as total FROM convocatoria GROUP BY tipo;
-- Deve retornar: convocado: 10, reserva: 10
```

---

## 🧪 VERIFICAÇÃO

Após sincronizar, executa:

```bash
node -e "const {db} = require('./db'); db.query('SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0', [], (err, r) => { console.log('Jogadores:', r[0].total); process.exit(); });"
```

**Resultado esperado:** `Jogadores: 20`

---

## 📋 O QUE O SCRIPT FAZ

1. **Verifica jogadores locais** vs lista completa (20)
2. **Identifica faltantes** (Filipe Garcês, Leonardo Sousa)
3. **Adiciona à tabela jogadores** com `suspenso = 0`
4. **Verifica convocatória** - quem está fora
5. **Adiciona à convocatória** como reservas no final da fila
6. **Mostra resumo final** com totais

---

## 🎯 ORDEM CORRETA DOS 20 JOGADORES

### Convocados (10)
1. Rogério Silva
2. Césaro Cruz
3. Carlos Silva
4. Nuno Ferreira
5. Joel Almeida
6. Carlos Correia
7. Joaquim Rocha
8. Ismael Campos
9. João Couto
10. Rui Lopes

### Reservas (10)
1. Ricardo Sousa
2. Valter Pinho
3. Serafim Sousa
4. Hugo Belga
5. Paulo Pinto
6. Flávio Silva
7. Manuel Rocha
8. Pedro Lopes
9. **Filipe Garcês** ← FALTA NO LOCALHOST
10. **Leonardo Sousa** ← FALTA NO LOCALHOST

---

## ⚠️ NOTA IMPORTANTE

Os jogadores **Filipe Garcês** e **Leonardo Sousa** não estão nos coletes porque:
- Sistema de coletes usa apenas os **10 convocados**
- Eles são **reservas** (posições 9 e 10)
- Quando subirem a convocados, entrarão automaticamente no sistema de coletes

---

## 🔧 APÓS SINCRONIZAR

1. **Reinicia o servidor:**
   ```bash
   npm start
   ```

2. **Acede à convocatória:**
   ```
   http://localhost:3000/convocatoria
   ```

3. **Verifica:**
   - ✅ 20 jogadores aparecem
   - ✅ 10 convocados
   - ✅ 10 reservas
   - ✅ Filipe Garcês e Leonardo Sousa nas reservas

4. **Opcional - Aplicar Config Final:**
   - Clica em "✅ Config Final"
   - Limpa todas as faltas
   - Aplica ordem correta

---

## 📊 ESTADO ATUAL

### Render (PostgreSQL) ✅
```
✅ 20 jogadores
✅ 10 convocados
✅ 10 reservas
✅ Dados corretos
```

### Localhost (SQLite) ❌ → ✅
```
Antes: 18 jogadores
Depois: 20 jogadores ✅
```

---

## 🚀 DEPLOY

Após sincronizar e testar localmente:

```bash
git add .
git commit -m "docs: Adicionar script de sincronização Render → Localhost"
git push origin main
```

**Render já tem os dados corretos, não precisa de deploy!**

---

## ✅ CHECKLIST FINAL

- [ ] Executar `node sync_from_render.js` ou `SYNC.bat`
- [ ] Verificar: 20 jogadores no localhost
- [ ] Verificar: 10 convocados + 10 reservas
- [ ] Ver Filipe Garcês e Leonardo Sousa nas reservas
- [ ] Testar página /convocatoria
- [ ] Opcional: Clicar "Config Final" para limpar faltas

---

**Status:** Script criado e pronto para executar! 🎉
