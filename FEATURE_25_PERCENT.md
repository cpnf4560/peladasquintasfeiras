# ✅ Alterações: Sistema de Mínimo de Jogos (25%)

## 📋 Resumo das Alterações

Implementado sistema de mínimo de participação para classificação geral e análise de duplas.

---

## 🎯 Alterações Implementadas

### 1. ✅ Classificação Geral - Filtro de 25%

#### **Regra:**
- Jogadores precisam ter jogado **pelo menos 25%** dos jogos totais para aparecerem na classificação principal
- Jogadores com menos de 25% aparecem **no fundo da tabela** com **fundo cinzento**

#### **Lógica:**
```javascript
const totalJogos = [total de jogos no período]
const minimoJogos = Math.ceil(totalJogos * 0.25) // 25%

// Exemplo:
// Se totalJogos = 40 → minimoJogos = 10
// Se totalJogos = 15 → minimoJogos = 4
```

#### **Ordenação:**
1. **Primeiro:** Jogadores com ≥ 25% (ordenados normalmente)
2. **Depois:** Jogadores com < 25% (ordenados normalmente mas no fundo)

#### **Visual:**
- Jogadores com < 25%: **fundo cinzento** (#f5f5f5)
- **Nota explicativa** no fim da tabela:
  ```
  ℹ️ Nota: Para aparecer na classificação principal, os jogadores 
  precisam ter participado em pelo menos X jogos (25% de Y jogos totais).
  Jogadores com menos jogos aparecem no fundo da tabela com fundo cinzento.
  ```

---

### 2. ✅ Análise de Duplas - Filtro Duplo

#### **Regras (ambas devem ser cumpridas):**
1. Dupla precisa ter jogado **pelo menos 3 jogos juntos** (regra antiga)
2. **AMBOS os jogadores** precisam ter **pelo menos 25% de presenças individuais** (regra nova)

#### **Lógica SQL:**
```sql
WITH jogadores_ativos AS (
  -- Apenas jogadores com ≥ 25% de presenças
  SELECT id, nome
  FROM jogadores
  GROUP BY id
  HAVING COUNT(jogos) >= minimoJogos
)
SELECT ...
FROM presencas p1
JOIN presencas p2 ON ...
JOIN jogadores_ativos j1 ON p1.jogador_id = j1.id
JOIN jogadores_ativos j2 ON p2.jogador_id = j2.id
HAVING COUNT(DISTINCT jogo.id) >= 3
```

#### **Resultado:**
- Apenas duplas onde **ambos os jogadores são "ativos"** (≥25%) aparecem
- Elimina duplas com jogadores esporádicos

---

## 📁 Arquivos Modificados

### 1. `routes/estatisticas.js`

#### **Query de Total de Jogos:**
```javascript
const queryTotalJogos = `SELECT COUNT(*) as total FROM jogos WHERE 1=1 ${filtroData}`;
```

#### **Cálculo do Mínimo:**
```javascript
const totalJogos = totalResult[0]?.total || 0;
const minimoJogos = Math.ceil(totalJogos * 0.25);
```

#### **Processamento das Estatísticas:**
```javascript
const estatisticasProcessadas = estatisticas.map(stat => ({
  ...stat,
  temMinimoJogos: stat.jogos >= minimoJogos
}));

// Separar em dois grupos
const comMinimoJogos = estatisticasProcessadas.filter(s => s.temMinimoJogos);
const semMinimoJogos = estatisticasProcessadas.filter(s => !s.temMinimoJogos);

// Ordenar cada grupo separadamente
// [código de ordenação]

// Combinar: primeiro os com mínimo, depois os sem
const estatisticasOrdenadas = [...comMinimoJogos, ...semMinimoJogos];
```

#### **Query de Duplas Atualizada:**
```javascript
const queryDuplas = `
  WITH jogadores_ativos AS (
    SELECT jog.id, jog.nome
    FROM jogadores jog
    LEFT JOIN presencas p ON jog.id = p.jogador_id
    LEFT JOIN jogos j ON p.jogo_id = j.id
    WHERE jog.suspenso = 0 ${filtroData}
    GROUP BY jog.id, jog.nome
    HAVING COUNT(DISTINCT j.id) >= ${minimoJogos}
  )
  SELECT ...
  FROM presencas p1
  JOIN presencas p2 ON ...
  JOIN jogadores_ativos j1 ON p1.jogador_id = j1.id  -- Apenas ativos
  JOIN jogadores_ativos j2 ON p2.jogador_id = j2.id  -- Apenas ativos
  ...
  HAVING COUNT(DISTINCT jogo.id) >= 3
`;
```

#### **Função renderView Atualizada:**
```javascript
function renderView(res, req, estatisticas, ..., totalJogos, minimoJogos) {
  res.render('estatisticas', {
    // ...outros campos...
    totalJogos: totalJogos || 0,
    minimoJogos: minimoJogos || 0
  });
}
```

---

### 2. `views/estatisticas.ejs`

#### **Classe CSS na Linha da Tabela:**
```html
<tr class="<%= !stat.temMinimoJogos ? 'sem-minimo-jogos' : '' %>">
```

#### **Nota Explicativa (após tabela):**
```html
<% if (totalJogos && minimoJogos) { %>
  <div class="nota-minimo-jogos">
    ℹ️ <strong>Nota:</strong> Para aparecer na classificação principal, 
    os jogadores precisam ter participado em pelo menos 
    <strong><%= minimoJogos %> jogos</strong> (25% de <%= totalJogos %> jogos totais). 
    Jogadores com menos jogos aparecem no fundo da tabela com fundo cinzento.
  </div>
<% } %>
```

---

### 3. `public/style.css`

#### **Estilo para Jogadores Sem Mínimo:**
```css
/* Jogadores sem mínimo de jogos (25%) */
.stats-table tr.sem-minimo-jogos,
table tr.sem-minimo-jogos {
  background-color: #f5f5f5 !important;
  opacity: 0.8;
}

.stats-table tr.sem-minimo-jogos:hover,
table tr.sem-minimo-jogos:hover {
  background-color: #eeeeee !important;
  opacity: 0.9;
}
```

#### **Estilo para Nota Explicativa:**
```css
.nota-minimo-jogos {
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-left: 4px solid #6c757d;
  border-radius: 4px;
  color: #495057;
  font-size: 0.95rem;
  line-height: 1.6;
}

.nota-minimo-jogos strong {
  color: #212529;
  font-weight: 700;
}
```

---

## 🧪 Exemplos de Comportamento

### Exemplo 1: 40 Jogos Totais
- **Mínimo necessário:** 10 jogos (25%)
- **Jogador A:** 15 jogos → **classificação principal**
- **Jogador B:** 8 jogos → **fundo da tabela (cinzento)**

### Exemplo 2: Análise de Duplas
**Cenário:**
- Total de jogos: 40
- Mínimo: 10 jogos (25%)

**Dupla 1:**
- Jogador A: 15 jogos individuais ✅
- Jogador B: 12 jogos individuais ✅
- Jogos juntos: 5 ✅
- **Resultado:** **APARECE** na análise (ambos ≥25% e ≥3 jogos juntos)

**Dupla 2:**
- Jogador C: 18 jogos individuais ✅
- Jogador D: 6 jogos individuais ❌ (< 10)
- Jogos juntos: 4 ✅
- **Resultado:** **NÃO APARECE** (Jogador D não tem 25%)

**Dupla 3:**
- Jogador E: 15 jogos individuais ✅
- Jogador F: 14 jogos individuais ✅
- Jogos juntos: 2 ❌ (< 3)
- **Resultado:** **NÃO APARECE** (menos de 3 jogos juntos)

---

## 📊 Vantagens do Sistema

### Para Classificação Geral:
1. ✅ **Elimina distorções** de jogadores com poucos jogos e alta %
2. ✅ **Mantém transparência** - jogadores com < 25% ainda aparecem
3. ✅ **Dinâmico** - adapta-se ao número total de jogos
4. ✅ **Visual claro** - fundo cinzento + nota explicativa

### Para Análise de Duplas:
1. ✅ **Elimina duplas "esporádicas"** com jogadores ocasionais
2. ✅ **Garante relevância** - apenas duplas de jogadores ativos
3. ✅ **Critérios duplos** - mínimo de jogos juntos + participação individual
4. ✅ **Estatísticas mais confiáveis**

---

## 🔍 Comportamento Dinâmico

### Por Período:
- **Ano completo (40 jogos):** mínimo = 10 jogos
- **Mês específico (4 jogos):** mínimo = 1 jogo
- **3 meses (12 jogos):** mínimo = 3 jogos

### Cálculo:
```javascript
minimoJogos = Math.ceil(totalJogos * 0.25)

// Exemplos:
// 40 jogos → 10 (25%)
// 15 jogos → 4 (26.7%)
// 4 jogos → 1 (25%)
// 3 jogos → 1 (33.3%)
```

---

## 🚨 Casos Especiais

### Caso 1: Poucos Jogos no Período
- Se `totalJogos < 4` → `minimoJogos = 1`
- Praticamente todos os jogadores aparecem na classificação principal

### Caso 2: Nenhum Jogador Atinge Mínimo
- Classificação principal vazia
- Todos aparecem no fundo (cinzento)
- Análise de duplas pode ficar vazia

### Caso 3: Filtro por Mês
- Mínimo calculado baseado nos jogos **daquele mês**
- Não usa jogos do ano completo
- Pode resultar em mínimos mais baixos (ex: 1-2 jogos)

---

## 🧪 Testes Recomendados

### Classificação Geral:
- [ ] Verificar separação visual (fundo cinzento)
- [ ] Confirmar nota explicativa aparece
- [ ] Testar com diferentes totais de jogos (4, 15, 40)
- [ ] Verificar ordenação correta em ambos os grupos

### Análise de Duplas:
- [ ] Confirmar que duplas com jogador < 25% não aparecem
- [ ] Verificar que mínimo de 3 jogos juntos ainda funciona
- [ ] Testar com filtros de mês/ano
- [ ] Verificar TOP 3 de cada categoria

---

## 📝 Notas de Implementação

### Compatibilidade SQL:
- ✅ **SQLite** (localhost) - funciona com CTE (WITH)
- ✅ **PostgreSQL** (Render) - funciona com CTE (WITH)

### Performance:
- Adiciona 1 query extra (contagem de jogos)
- CTE em duplas pode ser um pouco mais lento
- Para < 1000 jogadores/jogos: impacto mínimo

### Manutenção Futura:
- Para mudar % mínimo: alterar `0.25` para outro valor (ex: `0.30` = 30%)
- Para mudar mínimo de duplas: alterar `>= 3` na query

---

## ✅ Status

**Implementação:** ✅ Completa  
**Testes Locais:** ✅ Funcionando  
**Pronto para Deploy:** ✅ Sim  

---

**Data:** 18 Outubro 2025  
**Versão:** 2.1.0  
**Feature:** Sistema de Mínimo de Jogos (25%)
