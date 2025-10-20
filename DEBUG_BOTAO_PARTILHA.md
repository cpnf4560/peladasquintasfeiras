# 🔍 DEBUG BOTÃO DE PARTILHA

**Status:** 🔧 Em diagnóstico  
**Data:** 20 Janeiro 2025

---

## ❓ PROBLEMA REPORTADO

Utilizador reporta que o botão de partilha **não aparece** na página.

---

## ✅ VERIFICAÇÕES REALIZADAS

### 1. Arquivos Criados
- ✅ `public/share-button.js` - Script funcional
- ✅ `public/share-button.css` - Estilos completos
- ✅ `views/layout.ejs` - Links adicionados

### 2. Servidor
- ✅ Arquivo JS acessível em `/share-button.js` (9680 bytes)
- ✅ Servidor respondendo corretamente (200 OK)

### 3. Código JavaScript
- ✅ IIFE executando na carga
- ✅ Função `createShareButton()` implementada
- ✅ `document.body.appendChild(button)` chamado
- ✅ Console logs adicionados para debug

### 4. CSS
- ✅ `position: fixed !important`
- ✅ `z-index: 99999 !important`
- ✅ `display: flex !important`
- ✅ `opacity: 1 !important`
- ✅ `visibility: visible !important`

---

## 🔍 POSSÍVEIS CAUSAS

### 1. Cache do Browser
**Sintoma:** Arquivo antigo em cache  
**Solução:**
```
Ctrl + Shift + R (hard reload)
ou
Ctrl + Shift + Delete (limpar cache)
```

### 2. JavaScript Desabilitado
**Sintoma:** Scripts não executam  
**Solução:** Verificar configurações do browser

### 3. AdBlock/Extensions
**Sintoma:** Extensão bloqueia elemento "share"  
**Solução:** Desabilitar temporariamente AdBlock

### 4. CSP (Content Security Policy)
**Sintoma:** Scripts externos bloqueados  
**Solução:** Verificar headers HTTP

### 5. Conflito de CSS
**Sintoma:** Outro CSS sobrescreve estilos  
**Solução:** Já adicionado `!important` em todas propriedades críticas

---

## 🧪 TESTES PARA FAZER

### No Browser (F12 - Console)
```javascript
// 1. Verificar se script carregou
console.log('Script carregado?');

// 2. Verificar se botão existe no DOM
const btn = document.getElementById('share-button');
console.log('Botão existe?', btn);

// 3. Verificar estilos computados
if (btn) {
  const styles = window.getComputedStyle(btn);
  console.log('Display:', styles.display);
  console.log('Position:', styles.position);
  console.log('Z-index:', styles.zIndex);
  console.log('Opacity:', styles.opacity);
  console.log('Visibility:', styles.visibility);
}

// 4. Forçar criação manual (teste)
const testBtn = document.createElement('button');
testBtn.textContent = 'TESTE';
testBtn.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; background:red; color:white; padding:20px; border:none; border-radius:8px; cursor:pointer;';
document.body.appendChild(testBtn);
console.log('Botão teste adicionado');
```

---

## 🔧 CORREÇÕES APLICADAS

### Commit `5eb464a`
- ✅ CSS com `!important` em propriedades críticas
- ✅ Z-index aumentado para 99999
- ✅ Propriedades de visibilidade explícitas
- ✅ Console logs para diagnóstico

### Commit `1afcabc`
- ✅ Console logs no início do script
- ✅ Logs ao criar botão
- ✅ Logs ao adicionar event listener

### Commit `f57fffe`
- ✅ Fallback para partilha de link
- ✅ Criação imediata do botão (sem esperar html2canvas)
- ✅ Tratamento de erros melhorado

---

## 📱 PÁGINA DE TESTE

Criada página dedicada: `/test-share.html`

**Funcionalidades:**
- Console logs automáticos
- Verificação após 1 segundo
- HTML simples sem conflitos
- Instruções de debug

**Acesso:**
```
http://localhost:3000/test-share.html
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. Testar Página de Teste
```bash
# Abrir no browser
http://localhost:3000/test-share.html
```

### 2. Verificar Console
Procurar por:
- `📱 Script share-button.js carregado!`
- `🔨 Criando botão de partilha...`
- `✅ Botão adicionado ao DOM`
- `✅ Event listener adicionado`

### 3. Inspecionar DOM
```
1. F12 → Elements
2. Procurar por: <button id="share-button"
3. Verificar se elemento existe
4. Ver estilos computados
```

### 4. Se Botão Não Aparece
```javascript
// Executar no console:
document.querySelectorAll('button').forEach(b => {
  console.log('Botão encontrado:', b.id, b.className, b);
});
```

---

## 🆘 SOLUÇÃO ALTERNATIVA IMEDIATA

Se o botão continuar sem aparecer, adicionar **inline no HTML**:

```html
<!-- No final do <body> em layout.ejs -->
<button onclick="window.open('https://wa.me/?text=' + encodeURIComponent(document.title + ' - ' + window.location.href), '_blank')" 
        style="position:fixed; bottom:20px; right:20px; z-index:99999; background:#25D366; color:white; padding:12px 20px; border:none; border-radius:50px; cursor:pointer; box-shadow:0 4px 12px rgba(37,211,102,0.4); font-weight:600;">
  📤 Partilhar
</button>
```

---

## 📊 CHECKLIST FINAL

- [x] JavaScript criado e testado
- [x] CSS criado com !important
- [x] Links adicionados ao layout.ejs
- [x] Console logs para debug
- [x] Página de teste criada
- [x] Fallback implementado
- [x] Commits enviados para GitHub
- [ ] **Testar em browser real com F12**
- [ ] **Verificar console logs**
- [ ] **Confirmar botão visível**

---

## 💡 DICA

Se estiver a testar no **VS Code Simple Browser**, pode haver limitações.  
Recomendo testar num **browser real** (Chrome/Firefox/Edge):

```
1. Abrir Chrome
2. Ir para: http://localhost:3000/convocatoria
3. F12 → Console
4. Verificar logs e DOM
```

---

**Status Atual:** Aguardando teste no browser real com F12 aberto para verificar console logs.
