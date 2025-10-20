# 🚀 TESTE RÁPIDO - 2 MINUTOS

## ⏰ AGUARDAR 5 MINUTOS
Deploy automático do Render em andamento. **Aguarde até 14:40** antes de testar.

---

## 📱 TESTE NO TELEMÓVEL (MAIS IMPORTANTE)

### 1. Limpar Cache
```
Android Chrome:
⋮ (menu) > Definições > Privacidade > Limpar dados > Imagens em cache

iPhone Safari:
Definições > Safari > Limpar histórico e dados
```

### 2. Abrir Site
```
https://peladasquintasfeiras.onrender.com
```

### 3. O Que Deve Ver
```
┌─────────────────────────────────┐
│ 🏀 Peladas    [☰]              │ ← Header fixo (escuro)
├─────────────────────────────────┤
│                                 │
│   Gestão de Coletes            │
│                                 │
│   (conteúdo da página)         │
│                                 │
│                                 │
│                        [📱]     │ ← Botão WhatsApp
└─────────────────────────────────┘
```

### 4. Testar Menu
```
1. Clicar no [☰] (canto superior direito)
2. Menu lateral deve deslizar da ESQUERDA
3. Fundo deve escurecer (overlay)
4. Ver links: Convocatória, Coletes, etc.
5. Clicar fora fecha o menu
```

---

## 💻 TESTE NO PC (Chrome DevTools)

### 1. Abrir Site
```
Chrome > https://peladasquintasfeiras.onrender.com
```

### 2. Ativar Modo Mobile
```
F12 (DevTools)
Ctrl+Shift+M (Device Toolbar)
```

### 3. Selecionar Dispositivo
```
Dropdown no topo > iPhone 12 Pro
```

### 4. Limpar Cache
```
Ctrl+Shift+Delete
☑ Imagens e arquivos em cache
Limpar dados
```

### 5. Recarregar
```
Ctrl+F5 (hard reload)
```

### 6. Verificar
```
✅ Header fixo no topo
✅ Menu hamburger visível (☰)
✅ Clicar abre menu lateral
✅ Conteúdo não sobreposto
```

---

## ❓ O QUE ESPERAR

### ✅ FUNCIONANDO
- Menu hamburger (☰) visível no canto superior direito
- Header com fundo escuro (#2c3e50)
- Logo pequeno à esquerda
- Clicar no ☰ abre menu lateral
- Overlay escuro aparece
- Menu fecha ao clicar fora

### ❌ AINDA COM PROBLEMA
Se não vir o menu hamburger:
1. Verificar largura da tela (deve ser <768px)
2. Limpar cache mais agressivamente
3. Fechar e reabrir navegador
4. Testar em modo anônimo
5. Tirar screenshot e reportar

---

## 📸 COMO DEVE PARECER

### Desktop (>768px)
```
Logo  [Convocatória] [Coletes] [Resultados]  👤 User
      ↑ Navegação horizontal (sem hamburger)
```

### Mobile (<768px)
```
🏀 Logo                                    [☰]
      ↑                                    ↑
   pequeno                            hamburger
                                        VISÍVEL!
```

### Mobile com Menu Aberto
```
┌───────┬────────────────────┐
│ Menu  │ /// Overlay ///    │
│       │ /// Escuro ///     │
│ ⚽ Con │ /// (fundo) ///    │
│ 👕 Col │ ////////////////   │
│ 🏆 Res │ ////////////////   │
│ 📊 Est │ ////////////////   │
└───────┴────────────────────┘
```

---

## 🕐 CRONOGRAMA

```
✅ 14:36 - Push para GitHub
🔄 14:37 - Render iniciou deploy
⏳ 14:38 - Building...
⏳ 14:39 - Deploying...
✅ 14:40 - LIVE! (testar agora)
```

---

## 🎯 VALIDAÇÃO RÁPIDA (30 segundos)

```bash
# Abrir console do navegador (F12 > Console)
# Colar este código:

console.log('Largura:', window.innerWidth);
console.log('Menu visível:', 
  window.getComputedStyle(
    document.querySelector('.mobile-menu-toggle')
  ).display
);

# Resultado esperado:
# Largura: 375 (ou <768)
# Menu visível: flex
```

---

## 📞 REPORTAR PROBLEMA

Se ainda não funcionar, reportar COM:
1. ✅ Screenshot da tela
2. ✅ Dispositivo (modelo do telemóvel)
3. ✅ Navegador (Chrome/Safari + versão)
4. ✅ Largura da tela (usar código acima)
5. ✅ CSS computado (F12 > Inspecionar botão)

---

**⏰ AGUARDAR ATÉ 14:40 E TESTAR!**

🎯 **Problema corrigido:** Menu hamburger com `display: none` sem media query  
✅ **Solução aplicada:** Adicionado `@media (max-width: 768px) { display: flex !important; }`  
🚀 **Status:** Deploy concluído - pronto para teste
