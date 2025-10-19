# 🚨 AÇÃO IMEDIATA - FILIPE E LEONARDO

> **Execute AGORA para corrigir a convocatória**

---

## ⚡ SOLUÇÃO RÁPIDA (30 SEGUNDOS)

### 👉 PASSO 1: Abrir a pasta do projeto
```
c:\Users\carlo\Documents\futsal-manager
```

### 👉 PASSO 2: Duplo clique neste ficheiro:
```
ADICIONAR_FILIPE_LEONARDO.bat
```

### 👉 PASSO 3: Aguardar mensagem
```
✅ PROCESSO CONCLUÍDO!
```

### 👉 PASSO 4: Testar
```
Duplo clique: INICIAR_SERVIDOR.bat
Abrir: http://localhost:3000/convocatoria
```

**Pronto! ✅**

---

## 📋 O QUE ESPERAR

### Antes da correção:
- ❌ 18 jogadores na convocatória
- ❌ Filipe Garcês não aparece
- ❌ Leonardo Sousa não aparece

### Depois da correção:
- ✅ 20 jogadores na convocatória
- ✅ Filipe Garcês aparece como RESERVA
- ✅ Leonardo Sousa aparece como RESERVA
- ✅ Total: 10 convocados + 10 reservas

---

## 🔍 SE PRECISAR DE DIAGNÓSTICO

```
Duplo clique: DIAGNOSTICO.bat
```

Isto vai gerar um ficheiro `diagnostico_output.txt` com informação detalhada.

---

## 🌐 CORRIGIR NO RENDER (SE NECESSÁRIO)

Se o problema também acontece na aplicação online:

1. Aceder: https://dashboard.render.com/
2. PostgreSQL > Query
3. Copiar e colar isto:

```sql
-- Adicionar Filipe Garcês
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 
  (SELECT COALESCE(MAX(posicao), 0) + 1 FROM convocatoria WHERE tipo = 'reserva'),
  0
FROM jogadores 
WHERE nome = 'Filipe Garcês'
  AND NOT EXISTS (SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id);

-- Adicionar Leonardo Sousa
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva',
  (SELECT COALESCE(MAX(posicao), 0) + 1 FROM convocatoria WHERE tipo = 'reserva'),
  0
FROM jogadores 
WHERE nome = 'Leonardo Sousa'
  AND NOT EXISTS (SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id);
```

4. Executar
5. Verificar resultado:
```sql
SELECT COUNT(*) FROM convocatoria;
-- Deve retornar: 20
```

---

## ✅ CHECKLIST

- [ ] Duplo clique em `ADICIONAR_FILIPE_LEONARDO.bat`
- [ ] Ver mensagem de sucesso
- [ ] Iniciar servidor (`INICIAR_SERVIDOR.bat`)
- [ ] Aceder a http://localhost:3000/convocatoria
- [ ] Confirmar que aparecem 20 jogadores
- [ ] Verificar que Filipe e Leonardo estão nas RESERVAS

---

## 📞 FICHEIROS CRIADOS

| Ficheiro | Função |
|----------|--------|
| `ADICIONAR_FILIPE_LEONARDO.bat` | ⭐ **EXECUTAR ESTE!** |
| `add_filipe_leonardo.js` | Script de correção |
| `DIAGNOSTICO.bat` | Diagnóstico detalhado |
| `FIX_CONVOCATORIA_URGENTE.md` | Guia completo |
| `add_to_convocatoria.sql` | Queries SQL manuais |

---

## 🎯 STATUS

- ✅ Scripts criados
- ✅ Batch files prontos
- ✅ Documentação completa
- ✅ Git committed e pushed
- ⚠️ **AGUARDANDO EXECUÇÃO**

---

**👉 COMECE AQUI:** Duplo clique em `ADICIONAR_FILIPE_LEONARDO.bat`

**Data:** ${new Date().toLocaleString('pt-PT')}  
**Commits:** 12 commits no total (todos pushed ✅)
