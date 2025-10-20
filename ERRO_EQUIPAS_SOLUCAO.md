# 🚨 SOLUÇÃO RÁPIDA - Erro ao Gerar Equipas

## Problema Identificado

Ao gerar equipas, ocorria **"Internal server error"** e depois não era possível voltar à página da convocatória.

## Causas

1. **Query SQL inválida** quando não há convocados confirmados
2. **`global.equipasGeradas` corrompido** impedia carregar a página
3. **Falta de tratamento de erros** na geração de equipas

## ✅ Correções Aplicadas

### 1. Validação de IDs (routes/convocatoria.js)
```javascript
// Verifica se há IDs antes de fazer a query
const idsConvocados = convocados.map(c => c.id).join(',');
if (!idsConvocados) {
  console.log('⚠️ Nenhum convocado confirmado');
  return res.status(400).send('Não há convocados confirmados suficientes');
}
```

### 2. COALESCE para Valores NULL
```javascript
// Evita NULL nas estatísticas
COALESCE(SUM(...), 0) as pontos_totais,
COALESCE(ROUND(...), 0) as media_pontos
```

### 3. Proteção na Renderização
```javascript
// Valida equipas antes de renderizar
let equipasValidas = null;
if (global.equipasGeradas) {
  try {
    if (global.equipasGeradas.equipa1 && global.equipasGeradas.equipa2) {
      equipasValidas = global.equipasGeradas;
    }
  } catch (e) {
    console.error('Erro ao validar equipas:', e);
    global.equipasGeradas = null;
  }
}
```

### 4. Try-Catch Completo
```javascript
try {
  // Código de geração de equipas
} catch (error) {
  console.error('❌ Erro crítico:', error);
  global.equipasGeradas = null;
  return res.status(500).send('Erro ao gerar equipas: ' + error.message);
}
```

### 5. Limpeza em Caso de Erro
```javascript
if (err) {
  global.equipasGeradas = null; // Limpa dados corrompidos
  return res.status(500).send('Erro...');
}
```

## 🛠️ Como Resolver Agora

### Opção 1: Reiniciar Servidor (RECOMENDADO)
```powershell
# Parar servidor
CTRL + C

# Reiniciar
npm start
```

### Opção 2: Usar Batch File
```powershell
# Duplo clique em:
LIMPAR_EQUIPAS.bat
```

### Opção 3: Matar Processo Node
```powershell
taskkill /F /IM node.exe
npm start
```

## 🎯 Como Testar

1. **Abrir página:** `http://localhost:3000/convocatoria`
2. **Confirmar jogadores** (mínimo 2)
3. **Clicar "⚖️ Gerar Equipas"**
4. **Verificar:**
   - ✅ Equipas geradas corretamente
   - ✅ Média de pontos exibida
   - ✅ Sem erros no console

## 📋 Checklist de Validação

- [ ] Página `/convocatoria` carrega sem erros
- [ ] Há pelo menos 2 jogadores confirmados
- [ ] Botão "Gerar Equipas" funciona
- [ ] Equipas são exibidas corretamente
- [ ] Média de pontos está visível
- [ ] Pode voltar à página normalmente

## ⚠️ Mensagens de Erro Possíveis

### "Não há convocados suficientes confirmados (mínimo 2)"
**Solução:** Confirme pelo menos 2 jogadores antes de gerar equipas

### "Erro ao buscar estatísticas"
**Solução:** Verifique se há jogos registados no sistema

### "Internal server error"
**Solução:** 
1. Verifique logs do servidor
2. Reinicie o servidor
3. Verifique conexão com banco de dados

## 📊 Logs Esperados

```
=== GERANDO EQUIPAS EQUILIBRADAS ===
📋 10 convocados encontrados
✅ Equipas geradas com sucesso
Equipa 1: 5 jogadores, média 2.34 pontos
Equipa 2: 5 jogadores, média 2.28 pontos
```

## 🔍 Debug

### Ver Logs em Tempo Real
```javascript
// No terminal onde o servidor está rodando
// Os logs aparecem automaticamente
```

### Verificar Equipas em Memória
```javascript
// No console do navegador (F12)
fetch('/convocatoria')
  .then(r => r.text())
  .then(console.log)
```

## 📝 Notas Técnicas

- **Global.equipasGeradas**: Armazena equipas em memória (limpa ao reiniciar)
- **Query SQL**: Usa LEFT JOIN para incluir jogadores sem histórico
- **COALESCE**: Garante que valores NULL sejam substituídos por 0
- **Try-Catch**: Captura erros críticos e limpa estado corrompido

## ✅ Status

**Correções Aplicadas:** ✅  
**Testado:** Pendente  
**Deploy:** Pendente  

---

**Última Atualização:** 2025-01-20  
**Versão:** 1.0
