# 📱 GUIA DE TESTE MOBILE - APÓS DEPLOY

## 🎯 Objetivo
Validar que a correção CSS mobile eliminou todas as sobreposições de elementos em dispositivos móveis reais.

## ⏰ Quando Testar
**Aguardar 3-5 minutos** após o push para o Render fazer deploy automático.

---

## 🧪 TESTE 1: Chrome DevTools (Simulador)

### Passo a Passo
1. Abrir site no Chrome desktop
2. Pressionar **F12** (DevTools)
3. Pressionar **Ctrl+Shift+M** (Toggle Device Toolbar)
4. Selecionar dispositivo: **iPhone 12 Pro** ou **Galaxy S20**
5. **IMPORTANTE:** Desmarcar "Desktop" se aparecer essa opção
6. Pressionar **Ctrl+R** para recarregar a página

### ✅ Checklist Visual
- [ ] Header fixo aparece no topo (fundo escuro #2c3e50)
- [ ] Logo visível no canto esquerdo
- [ ] Menu hamburger (☰) visível no canto direito
- [ ] Conteúdo começa ABAIXO do header (não sobreposto)
- [ ] Ao fazer scroll, header permanece fixo no topo
- [ ] Botão verde WhatsApp no canto inferior direito

### ✅ Checklist Interatividade
- [ ] Clicar no menu hamburger abre menu lateral da esquerda
- [ ] Overlay escuro aparece sobre o conteúdo
- [ ] Menu tem links clicáveis (Convocatória, Coletes, etc.)
- [ ] Clicar no overlay fecha o menu
- [ ] Clicar em link do menu fecha o menu e navega
- [ ] Hamburger vira X quando menu aberto

---

## 📱 TESTE 2: Dispositivo Android Real

### Preparação
1. Pegar smartphone Android
2. Abrir Chrome ou navegador padrão
3. Acessar: **https://peladasquintasfeiras.onrender.com**

### ✅ Checklist Visual
- [ ] Header fixo no topo (não rola com página)
- [ ] Logo pequeno visível
- [ ] Menu hamburger visível e grande (44px mínimo)
- [ ] Nenhum elemento sobreposto
- [ ] Espaço claro entre header e conteúdo
- [ ] Botão WhatsApp flutuante no canto

### ✅ Checklist Toque
- [ ] Menu hamburger responde ao toque (min 44x44px)
- [ ] Menu abre suavemente da esquerda
- [ ] Overlay escuro visível
- [ ] Links do menu fáceis de clicar
- [ ] Fechar menu clicando fora funciona
- [ ] Botão WhatsApp clicável e funcional

### ✅ Checklist Scroll
- [ ] Header NÃO rola junto com conteúdo
- [ ] Header permanece sempre visível no topo
- [ ] Scroll suave sem bugs visuais
- [ ] Botão WhatsApp permanece fixo

---

## 📱 TESTE 3: Dispositivo iOS Real (iPhone/iPad)

### Preparação
1. Pegar iPhone/iPad
2. Abrir Safari
3. Acessar: **https://peladasquintasfeiras.onrender.com**

### ✅ Checklist Visual (Safari iOS)
- [ ] Header fixo e visível
- [ ] Menu hamburger acessível
- [ ] Sem elementos cortados ou sobrepostos
- [ ] Fontes legíveis
- [ ] Botão partilha visível

### ✅ Checklist Funcional (Safari iOS)
- [ ] Menu abre/fecha corretamente
- [ ] Transições suaves
- [ ] Touch responsivo
- [ ] Scroll sem bugs
- [ ] WhatsApp abre ao clicar botão

---

## 🔍 TESTE 4: Páginas Específicas

### Testar em TODAS estas páginas:

#### 1. `/convocatoria` (Convocatória)
- [ ] Header fixo
- [ ] Listas de jogadores não sobrepostas
- [ ] Botões de ação visíveis e clicáveis
- [ ] Scroll funcional

#### 2. `/coletes` (Coletes)
- [ ] Header fixo
- [ ] Equipas lado a lado ou empilhadas
- [ ] Cores das equipas visíveis
- [ ] Tabela com scroll horizontal se necessário

#### 3. `/jogos` (Resultados)
- [ ] Header fixo
- [ ] Cards de jogos empilhados
- [ ] Logo clicável leva para esta página
- [ ] Datas legíveis

#### 4. `/estatisticas` (Estatísticas)
- [ ] Header fixo
- [ ] Tabelas com wrapper scroll
- [ ] Gráficos/números legíveis
- [ ] Sem overflow horizontal

#### 5. `/comparacao` (Comparação)
- [ ] Header fixo
- [ ] Seletores de jogadores funcionais
- [ ] Comparações lado a lado ou empilhadas
- [ ] Botões touch-friendly

---

## 🐛 PROBLEMAS COMUNS (E COMO DIAGNOSTICAR)

### ❌ "Header não está fixo"
**Sintoma:** Header rola junto com conteúdo  
**Diagnóstico:**
1. Abrir DevTools
2. Inspecionar elemento `<header>`
3. Verificar CSS computado: `position: fixed !important`
4. Verificar `z-index: 999`

### ❌ "Menu hamburger invisível"
**Sintoma:** Não vejo o ☰  
**Diagnóstico:**
1. Verificar largura da tela < 768px
2. Inspecionar `.mobile-menu-toggle`
3. Verificar `display: flex !important`
4. Verificar `z-index: 1002`

### ❌ "Conteúdo sobreposto ao header"
**Sintoma:** Texto aparece por cima do header  
**Diagnóstico:**
1. Inspecionar `<body>`
2. Verificar `padding-top: 65px !important`
3. Inspecionar `<main>` ou `.container`
4. Verificar `z-index: 1`

### ❌ "Menu lateral não abre"
**Sintoma:** Clicar no hamburger não faz nada  
**Diagnóstico:**
1. Abrir Console (F12 > Console)
2. Procurar erros JavaScript
3. Verificar se `header.ejs` está carregado
4. Verificar se `.active` está sendo adicionado ao `<nav>`

### ❌ "Scroll horizontal indesejado"
**Sintoma:** Página mais larga que tela  
**Diagnóstico:**
1. Abrir DevTools
2. Inspecionar elemento que vaza
3. Verificar CSS: `max-width: 100vw`
4. Procurar elementos com `width` fixo > tela

---

## 📊 RESULTADO ESPERADO

### ✅ TUDO FUNCIONANDO:
```
✓ Header fixo no topo sempre visível
✓ Menu hamburger funcional (abre/fecha)
✓ Navegação lateral desliza suavemente
✓ Conteúdo começa abaixo do header (padding 65px)
✓ Zero sobreposições de elementos
✓ Scroll suave sem bugs visuais
✓ Botão WhatsApp visível e clicável
✓ Todas as páginas responsivas
✓ Touch targets mínimo 44x44px
✓ Sem scroll horizontal
```

### ⚠️ SE ALGO FALHAR:
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Recarregar página com cache limpo (Ctrl+F5)
3. Verificar se deploy terminou no Render
4. Testar em modo anônimo/privado
5. Reportar bug com screenshot

---

## 📸 SCREENSHOTS ESPERADOS

### Desktop (>768px)
```
+------------------------------------------+
|  Logo  [Nav Links]           [User Info]|
+------------------------------------------+
|                                          |
|            Conteúdo                      |
|                                          |
+------------------------------------------+
```

### Mobile (<768px)
```
+-------------------------+
| Logo          [☰]       | ← Header fixo
+-------------------------+
|                         |
|     Conteúdo           |
|     (65px abaixo)      |
|                         |
|                 [📱]    | ← Botão WhatsApp
+-------------------------+
```

### Mobile com Menu Aberto
```
+-------------------------+
| Logo          [×]       | ← Header (hamburger vira X)
+---+---------------------+
| M |  Conteúdo escurecido|
| E |  (overlay)          |
| N |                     |
| U |              [📱]   |
+---+---------------------+
```

---

## ✅ APROVAÇÃO FINAL

**Apenas marcar como CONCLUÍDO se:**
- [x] Testado em Chrome DevTools mobile
- [ ] Testado em Android real
- [ ] Testado em iOS real (se disponível)
- [ ] Todas as páginas verificadas
- [ ] Zero bugs visuais
- [ ] Zero bugs funcionais
- [ ] Cliente aprovou (usuário final)

---

**Data de Deploy:** 20/10/2025  
**Versão:** mobile.css v3.1 + mobile-fix.css v1.0  
**Commit:** e39a73e

**🎉 PRÓXIMO PASSO:** Aguardar deploy no Render e testar em mobile real!
