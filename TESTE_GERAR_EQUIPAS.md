# 🧪 GUIA DE TESTE - Gerar Equipas

## 🎯 Objetivo
Testar se a funcionalidade de gerar equipas está funcionando corretamente após as correções.

## ⚡ Teste Rápido (2 minutos)

### 1. Reiniciar Servidor
```powershell
# Parar servidor (CTRL + C)
# Depois:
npm start
```

### 2. Acessar Convocatória
```
http://localhost:3000/convocatoria
```

### 3. Confirmar 2 Jogadores
- Clicar em ✅ ao lado de 2 jogadores quaisquer

### 4. Gerar Equipas
- Clicar em **"⚖️ Gerar Equipas Equilibradas"**

### 5. Verificar Resultado
✅ **SUCESSO** se:
- Aparecem 2 caixas (Equipa 1 e Equipa 2)
- Cada equipa mostra "Média: X.XX pts/jogo"
- Cada jogador mostra seus pontos individuais
- Página carrega sem erros

❌ **FALHA** se:
- Aparecer "Internal server error"
- Página ficar em branco
- Console mostrar erros

## 🧪 Testes Completos

### Teste 1: Sem Convocados Confirmados
**Passos:**
1. Desconfirmar todos os jogadores (clicar em ✅ verde)
2. Clicar "Gerar Equipas"

**Resultado Esperado:**
```
❌ Não há convocados suficientes confirmados (mínimo 2)
```

### Teste 2: 1 Convocado Apenas
**Passos:**
1. Confirmar apenas 1 jogador
2. Clicar "Gerar Equipas"

**Resultado Esperado:**
```
❌ Não há convocados suficientes confirmados (mínimo 2)
```

### Teste 3: 2 Convocados (Mínimo)
**Passos:**
1. Confirmar 2 jogadores
2. Clicar "Gerar Equipas"

**Resultado Esperado:**
```
✅ Equipa 1: 1 jogador
✅ Equipa 2: 1 jogador
✅ Médias exibidas
```

### Teste 4: 10 Convocados (Normal)
**Passos:**
1. Confirmar 10 jogadores
2. Clicar "Gerar Equipas"

**Resultado Esperado:**
```
✅ Equipa 1: 5 jogadores
✅ Equipa 2: 5 jogadores
✅ Distribuição equilibrada por pontos
✅ Médias semelhantes entre equipas
```

### Teste 5: Jogadores Sem Histórico
**Passos:**
1. Confirmar jogadores que nunca jogaram (0 jogos)
2. Clicar "Gerar Equipas"

**Resultado Esperado:**
```
✅ Equipas geradas normalmente
✅ Jogadores sem histórico aparecem com "0.00 pts"
✅ Sem erros
```

### Teste 6: Voltar à Página Depois de Gerar
**Passos:**
1. Gerar equipas com sucesso
2. Navegar para outra página (ex: /coletes)
3. Voltar para /convocatoria

**Resultado Esperado:**
```
✅ Página carrega normalmente
✅ Equipas ainda aparecem
✅ Sem erros
```

### Teste 7: Gerar Equipas Múltiplas Vezes
**Passos:**
1. Gerar equipas
2. Confirmar/desconfirmar alguns jogadores
3. Gerar equipas novamente
4. Repetir 3-4 vezes

**Resultado Esperado:**
```
✅ Sempre gera sem erro
✅ Equipas atualizam corretamente
✅ Memória não corrompe
```

## 📊 Logs Esperados

### Console do Navegador (F12)
```
✅ Sem erros vermelhos
✅ Sem avisos de JavaScript
```

### Terminal do Servidor
```
=== GERANDO EQUIPAS EQUILIBRADAS ===
📋 10 convocados encontrados
✅ Equipas geradas com sucesso
Equipa 1: 5 jogadores, média 2.34 pontos
Equipa 2: 5 jogadores, média 2.28 pontos
```

## 🐛 Troubleshooting

### Erro: "Internal server error"
**Solução:**
```powershell
# 1. Parar servidor
CTRL + C

# 2. Reiniciar
npm start

# 3. Verificar logs no terminal
```

### Página não carrega
**Solução:**
```powershell
# 1. Limpar cache do navegador
CTRL + SHIFT + DELETE

# 2. Reiniciar servidor
npm start

# 3. Abrir em janela anônima
CTRL + SHIFT + N (Chrome)
```

### Equipas não aparecem
**Solução:**
1. Verificar se pelo menos 2 jogadores estão confirmados (✅ verde)
2. Verificar console do navegador (F12)
3. Verificar logs do servidor no terminal

### "Não há convocados suficientes"
**Solução:**
1. Confirmar pelo menos 2 jogadores
2. Verificar se jogadores estão na lista de "Convocados" (não "Reservas")
3. Se estiver em "Reservas", usar setas para mover para "Convocados"

## ✅ Checklist de Aceitação

- [ ] Gera equipas com 2 jogadores
- [ ] Gera equipas com 10 jogadores
- [ ] Funciona com jogadores sem histórico
- [ ] Mostra média de pontos
- [ ] Mostra pontos individuais
- [ ] Página carrega depois de erro
- [ ] Pode voltar à página normalmente
- [ ] Pode gerar múltiplas vezes
- [ ] Sem erros no console
- [ ] Logs corretos no servidor

## 🎯 Critérios de Sucesso

### Mínimo (Obrigatório)
- ✅ Gera equipas sem erro
- ✅ Página sempre carrega
- ✅ Mostra média de pontos

### Ideal (Desejável)
- ✅ Distribuição equilibrada
- ✅ Funciona com qualquer número de jogadores
- ✅ Logs úteis para debug

### Excelente (Extra)
- ✅ Performance rápida (<1s)
- ✅ Animação suave ao gerar
- ✅ Mensagens de erro amigáveis

## 📝 Relatório de Teste

```
Data: ___/___/2025
Testador: ________________

[ ] Teste 1: Sem convocados - PASSOU / FALHOU
[ ] Teste 2: 1 convocado - PASSOU / FALHOU
[ ] Teste 3: 2 convocados - PASSOU / FALHOU
[ ] Teste 4: 10 convocados - PASSOU / FALHOU
[ ] Teste 5: Sem histórico - PASSOU / FALHOU
[ ] Teste 6: Voltar à página - PASSOU / FALHOU
[ ] Teste 7: Múltiplas gerações - PASSOU / FALHOU

Resultado Final: APROVADO / REPROVADO

Observações:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Versão:** 1.0  
**Data:** 2025-10-20  
**Duração Estimada:** 5-10 minutos
