# 🚨 INSTRUÇÕES DE DEBUG - DUPLAS NÃO APARECEM

## PASSO 1: TESTAR SE HÁ DUPLAS NA BASE DE DADOS

Abre PowerShell e corre:
```powershell
cd c:\Users\carlo\Documents\futsal-manager
node TEST_DUPLAS_FINAL.js
```

**O que deves ver:**
- ✅ Número de duplas encontradas
- ✅ TOP 3 de cada categoria
- ✅ "EXISTE ✅" no resultado final

**Se vires "NULL ❌"** → Não há duplas com 3+ jogos em 2025!

---

## PASSO 2: REINICIAR SERVIDOR COM LOGS

1. Para o servidor atual (CTRL+C no terminal onde está a correr)

2. Corre de novo:
```powershell
cd c:\Users\carlo\Documents\futsal-manager
node server.js
```

3. Abre o browser em:
```
http://localhost:3000/estatisticas
```

4. **OLHA PARA O TERMINAL** onde o servidor está a correr!

**Deves ver LOGS assim:**
```
🔍 [DUPLAS DEBUG] Erro? Nenhum
🔍 [DUPLAS DEBUG] Resultados: 15
✅ [DUPLAS DEBUG] A processar 15 duplas
📊 [DUPLAS DEBUG] Objeto criado:
   melhorVitorias: 3
   piorVitorias: 3
   menosJogos: 3
🎯 [RENDER] Renderizando sem mês, duplas: SIM
🖼️  [RENDERVIEW] Chamada com duplas: SIM
   melhorVitorias: 3
   piorVitorias: 3
   menosJogos: 3
```

---

## PASSO 3: COPIAR OS LOGS

**Copia TUDO o que aparece no terminal** depois de abrires `/estatisticas`

Envia-me os logs!

---

## SE AINDA NÃO FUNCIONA:

### Verificar o HTML gerado:

1. Abre `/estatisticas` no browser
2. Pressiona F12 (DevTools)
3. Vai ao separador "Elements" ou "Inspetor"
4. Procura por "Análise de Duplas" (CTRL+F)

**Se encontrares** → O HTML está lá, o problema é CSS!
**Se NÃO encontrares** → O HTML não está a ser gerado!

### Se o HTML não está lá:

No DevTools, vai à Console e escreve:
```javascript
console.log(window.duplas);
```

Diz-me o que aparece!

---

## INFORMAÇÃO QUE PRECISO:

1. **Output do `TEST_DUPLAS_FINAL.js`** (copiar tudo)
2. **Logs do terminal do servidor** quando abres `/estatisticas`
3. **Screenshot da Console do browser** (F12 > Console)
4. **Procurar "Análise de Duplas" no HTML** (encontraste? SIM/NÃO)
