# 🧹 LIMPAR CONTAGEM DE FALTAS

> **Guia rápido para zerar todas as faltas**

---

## 🚀 SOLUÇÃO RÁPIDA

### Localhost (30 segundos)

#### Opção 1: Duplo Clique (RECOMENDADO)
```
📂 Abrir pasta: c:\Users\carlo\Documents\futsal-manager
📄 Duplo clique: LIMPAR_FALTAS.bat
⏱️ Confirmar quando pedido
✅ Aguardar: "🎉 Todas as faltas foram limpas com sucesso!"
```

#### Opção 2: Linha de Comando
```bash
cd c:\Users\carlo\Documents\futsal-manager
node limpar_faltas.js
```

---

## 🌐 LIMPAR NO RENDER (Produção)

### 1. Aceder ao Render Dashboard
- URL: https://dashboard.render.com/
- Login com suas credenciais

### 2. Aceder ao PostgreSQL
1. Dashboard > PostgreSQL (seu banco de dados)
2. Tab **"Query"**

### 3. Executar SQL
Copiar e colar:

```sql
-- Ver total antes
SELECT COUNT(*) as total_faltas FROM faltas_historico;

-- LIMPAR TUDO
DELETE FROM faltas_historico;

-- Verificar (deve retornar 0)
SELECT COUNT(*) as total_faltas FROM faltas_historico;
```

### 4. Verificar Resultado
Todos os jogadores devem ter 0 faltas:

```sql
SELECT j.nome, 
       COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
FROM jogadores j
WHERE COALESCE(j.suspenso, 0) = 0
ORDER BY j.nome;
```

---

## ✅ O QUE ACONTECE

### Antes
- ❌ Jogadores com X faltas acumuladas
- ❌ Histórico de faltas completo

### Depois
- ✅ Todos os jogadores com 0 faltas
- ✅ Histórico limpo (tabela vazia)
- ✅ Convocatória mantida (não é afetada)

---

## ⚠️ IMPORTANTE

### O que é apagado:
- ✅ **Histórico de faltas** (tabela `faltas_historico`)

### O que NÃO é afetado:
- ✅ Jogadores
- ✅ Jogos
- ✅ Convocatória
- ✅ Presenças
- ✅ Coletes
- ✅ Estatísticas

---

## 🔄 SINCRONIZAÇÃO

### Depois de limpar no Render:
```
📄 Duplo clique: SYNC.bat
```

Isto vai sincronizar as faltas limpas do Render para o localhost.

---

## 📋 QUANDO USAR

### Use este script quando:
- 🔄 Iniciar nova temporada
- 🎯 Resetar sistema de faltas
- 🧹 Limpeza geral de dados
- 🔧 Configuração inicial

### Use "Config Final" quando:
- ⚽ Antes de cada jogo (no menu da convocatória)
- 🎮 Limpar apenas faltas dos convocados
- ⚡ Preparar para o próximo jogo

---

## 🆘 TROUBLESHOOTING

### ❌ Erro: "Cannot find module"
```bash
# Certifique-se de estar na pasta correta:
cd c:\Users\carlo\Documents\futsal-manager
```

### ❌ Erro ao executar no Render
- Verificar se está conectado ao banco correto
- Verificar se a tabela `faltas_historico` existe
- Tentar executar query por query

### ❌ Faltas não limpam
1. Verificar se o script executou sem erros
2. Executar query de verificação:
   ```sql
   SELECT COUNT(*) FROM faltas_historico;
   ```
3. Se retornar > 0, executar novamente:
   ```sql
   DELETE FROM faltas_historico;
   ```

---

## 📊 VERIFICAÇÃO FINAL

### Depois de executar:

1. **Verificar total:**
   ```sql
   SELECT COUNT(*) FROM faltas_historico;
   ```
   **Esperado:** 0

2. **Verificar jogadores:**
   - Aceder à aplicação
   - Ir para Convocatória
   - Verificar que nenhum jogador tem faltas

3. **Testar sistema:**
   - Marcar uma falta para teste
   - Verificar que conta corretamente
   - Limpar novamente se necessário

---

## 📁 FICHEIROS CRIADOS

| Ficheiro | Função |
|----------|--------|
| `limpar_faltas.js` | Script de limpeza |
| `LIMPAR_FALTAS.bat` | Duplo clique (localhost) |
| `LIMPAR_FALTAS_RENDER.sql` | Queries para Render |
| `LIMPAR_FALTAS_GUIA.md` | Este guia |

---

## 🎯 CHECKLIST

### Localhost
- [ ] Duplo clique em `LIMPAR_FALTAS.bat`
- [ ] Confirmar quando pedido
- [ ] Ver mensagem de sucesso
- [ ] Verificar na aplicação

### Render
- [ ] Aceder ao Dashboard
- [ ] PostgreSQL > Query
- [ ] Executar `DELETE FROM faltas_historico;`
- [ ] Verificar resultado (COUNT = 0)
- [ ] Sincronizar: `SYNC.bat`

---

## 💡 DICA

### Para limpar antes de cada jogo:
Use o botão **"Config Final"** na página da convocatória.

### Para limpar tudo (reset completo):
Use os scripts desta página.

---

**Criado em:** ${new Date().toLocaleString('pt-PT')}  
**Status:** ✅ Pronto para usar
