# 🚨 SOLUÇÃO RÁPIDA - ERRO INDISPONÍVEIS

## ❌ PROBLEMA
```
indisponiveis is not defined
```

**Causa:** A tabela `indisponiveis_temporarios` não existe na base de dados local (`futsal.db`).

---

## ✅ SOLUÇÃO (30 SEGUNDOS)

### Opção 1: Duplo-clique no arquivo batch (MAIS FÁCIL)
```
1. Localizar arquivo: CRIAR_TABELA_INDISPONIVEIS.bat
2. Duplo-clique para executar
3. Aguardar mensagem "✅ Tabela criada com sucesso"
4. Fechar janela
```

### Opção 2: Executar via PowerShell
```powershell
node criar_tabela_indisponiveis.js
```

### Opção 3: Reiniciar o servidor (cria automaticamente)
```powershell
# Parar servidor atual (Ctrl+C)
# Iniciar novamente
node server.js
```

**Nota:** O `server.js` já tem código para criar a tabela automaticamente no startup. Reiniciar o servidor deve resolver.

---

## 🔍 VERIFICAR SE FUNCIONOU

Após executar qualquer opção acima:

```powershell
node -e "const {db} = require('./db'); db.query('SELECT COUNT(*) as total FROM indisponiveis_temporarios', [], (e,r) => { if(e) console.log('❌ Erro:', e.message); else console.log('✅ Tabela existe! Total:', r[0].total); setTimeout(() => process.exit(0), 500); });"
```

**Resultado esperado:**
```
✅ Tabela existe! Total: 0
```

---

## 📊 O QUE A TABELA FAZ

A tabela `indisponiveis_temporarios` armazena jogadores temporariamente ausentes:
- **Formação profissional** → Não recebem faltas durante curso
- **Lesão** → Não são penalizados por ausência médica
- **Viagem** → Período de ausência justificado

**Campos:**
- `jogador_id` - Quem está indisponível
- `data_inicio` - Quando começou
- `data_fim` - Quando volta (opcional)
- `numero_jogos` - Quantos jogos ficará ausente (opcional)
- `motivo` - Razão da ausência
- `posicao_original` - Onde estava (para retornar ao mesmo lugar)
- `tipo_original` - Se era convocado ou reserva
- `ativo` - 1 = ainda indisponível, 0 = já retornou

---

## 🎯 AÇÃO IMEDIATA

**FAÇA AGORA (escolha uma):**

1. ⚡ **MAIS RÁPIDO:** Duplo-clique em `CRIAR_TABELA_INDISPONIVEIS.bat`

2. 🔄 **ALTERNATIVA:** Reiniciar o servidor (Ctrl+C e depois `node server.js`)

3. 💻 **MANUAL:** Executar no PowerShell:
   ```powershell
   node criar_tabela_indisponiveis.js
   ```

**Tempo:** 10 segundos  
**Resultado:** Erro desaparece e sistema funciona! ✅

---

## ✅ APÓS CORRIGIR

O erro irá desaparecer e você verá:

1. **Página carrega normalmente** ✅
2. **3º card** "Indisponíveis Temporários" aparece ✅
3. **Botão** "➕ Adicionar Indisponível" (admin) ✅
4. **Tabela vazia** mostrando "Todos os jogadores disponíveis" ✅

---

## 🚀 TESTAR SISTEMA

Após resolver o erro:

1. Ir para: http://localhost:3000/convocatoria
2. Clicar em "➕ Adicionar Indisponível" (admin)
3. Selecionar jogador
4. Tipo: "Por jogos" → 2 jogos
5. Motivo: "Teste - Formação"
6. Submeter

**Resultado:** Jogador aparece na lista de indisponíveis! 🎉

---

**Status:** 🔧 CORREÇÃO PRONTA  
**Ação:** Execute um dos comandos acima AGORA  
**Tempo:** 10-30 segundos  

🎯 **O sistema funcionará imediatamente após criar a tabela!**
