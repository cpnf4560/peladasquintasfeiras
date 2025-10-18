# 🔥 GUIA DE EMERGÊNCIA - RESOLVER AGORA

## PROBLEMA:
- ❌ CSS não aparece
- ❌ Duplas não aparecem

## SOLUÇÃO EM 3 PASSOS:

### PASSO 1: INICIAR O SERVIDOR
```
Faz duplo-clique em: start.bat
```
(Está na pasta `c:\Users\carlo\Documents\futsal-manager\`)

### PASSO 2: TESTAR CSS
Abre no browser:
```
http://localhost:3000/test_css.html
```

**O que deves ver:**
- ✅ Título VERMELHO 
- ✅ Caixa AMARELA

**Se NÃO vires isto** → O CSS não está a carregar!

### PASSO 3: VER ESTATÍSTICAS
Abre no browser:
```
http://localhost:3000/estatisticas
```

Faz **CTRL + SHIFT + R** para forçar refresh!

**O que deves ver:**
- ✅ Página formatada (não texto simples)
- ✅ Secção "Análise de Duplas" 
- ✅ TOP 3 - Duplas com mais % de vitórias
- ✅ TOP 3 - Duplas com mais % de derrotas
- ✅ TOP 3 - Duplas com menos jogos juntos

## SE AINDA NÃO FUNCIONA:

### Verificar cache do browser:
1. Abre DevTools (F12)
2. Vai a Network
3. Procura `style.css`
4. Vê o "Response" - deve ter o CSS completo
5. Vê os "Response Headers" - deve ter `X-Asset-Source: root-public`

### Se `X-Asset-Source: nested-public`:
❌ **PROBLEMA:** Ainda está a servir da pasta errada!

Corre isto no PowerShell:
```powershell
Get-ChildItem -Path "c:\Users\carlo\Documents\futsal-manager" -Recurse -Filter "style.css"
```

Se vires MAIS DE UM ficheiro style.css → apaga os duplicados!

### Se as duplas não aparecem na página:
1. Abre DevTools (F12)
2. Vai à Console
3. Vê se há erros JavaScript
4. Copia os erros e envia-os

## CONTACTO RÁPIDO:
**Diz-me EXATAMENTE o que vês:**
- [ ] Título vermelho no test_css.html? SIM / NÃO
- [ ] Caixa amarela no test_css.html? SIM / NÃO
- [ ] CSS na página estatísticas? SIM / NÃO
- [ ] Secção "Análise de Duplas"? SIM / NÃO
- [ ] Erros na Console do browser? Quais?
