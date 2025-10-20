# ⚡ AÇÃO IMEDIATA - ATIVAR LOGIN NO RENDER

## 🎯 PASSOS RÁPIDOS (5 minutos)

### **1. Aguardar Deploy** ⏱️
```
O push acabou de ser feito.
Aguarde ~2 minutos para o Render fazer deploy automático.
```

**Como verificar:**
- Aceda: https://dashboard.render.com
- Selecione: "peladasquintasfeiras"
- Veja: Deploy em progresso (barra amarela/verde)
- Aguarde: Status "Live" ✅

---

### **2. Aceder ao Shell do Render** 🖥️

**Passo a passo:**
```
1. No dashboard do Render
2. Selecione o seu serviço
3. No topo, clique em "Shell" (tab ao lado de "Logs")
4. Aguarde o terminal carregar (~10 segundos)
```

---

### **3. Executar Comando** ⌨️

No shell do Render, cole e execute:
```bash
node setup_render_users.js
```

**Resultado esperado:**
```
🔧 CONFIGURANDO UTILIZADORES NO RENDER...
1️⃣ Limpando utilizadores antigos...
✅ Utilizadores antigos removidos
2️⃣ Criando novos utilizadores...
✅ Utilizador criado: presidente (admin)
✅ Utilizador criado: admin (admin)
✅ ATUALIZAÇÃO COMPLETA NO RENDER!
```

---

### **4. Testar Login** 🔐

**URL:** https://peladasquintasfeiras.onrender.com/login

**Credenciais para testar:**
```
Utilizador: admin
Palavra-passe: rzq7xgq8
```

**Checklist:**
- [ ] Página carrega com design moderno roxo ✨
- [ ] Login funciona sem erro ✅
- [ ] Redireciona para dashboard 🏠

---

## 🔄 ALTERNATIVA (se Shell não funcionar)

### Forçar novo deploy que cria users automaticamente:

**Editar qualquer ficheiro:**
```powershell
# Adicionar comentário em server.js
notepad server.js
# Adicionar uma linha de comentário qualquer
# Salvar
```

**Commit e Push:**
```powershell
git add server.js
git commit -m "trigger: Forçar criação de utilizadores"
git push origin main
```

O `server.js` já tem código que cria os utilizadores automaticamente se a tabela estiver vazia.

---

## 📊 RESUMO

### O que foi feito:
1. ✅ Script `setup_render_users.js` criado
2. ✅ Guia completo `ATIVAR_LOGIN_RENDER.md` criado
3. ✅ Commit e push feitos
4. 🔄 Deploy automático iniciado

### O que falta:
1. ⏳ Aguardar deploy (~2 min)
2. ⏳ Executar script no Render Shell
3. ⏳ Testar login

### Tempo total:
**~5 minutos** (incluindo espera do deploy)

---

## 🔐 CREDENCIAIS FINAIS

Após executar o script, estas credenciais estarão ativas:

| Utilizador | Palavra-passe | Papel |
|-----------|---------------|-------|
| `presidente` | `Bodelos123*` | admin |
| `admin` | `rzq7xgq8` | admin |

---

## ✅ VALIDAÇÃO

**Login OK quando:**
- ✅ Sem erro "Utilizador não encontrado"
- ✅ Sem erro "Senha inválida"
- ✅ Redireciona para dashboard
- ✅ Vê convocatória com badge "Em vigor desde..."

---

**Status:** 🎯 PRONTO  
**Ação:** Aguarde deploy + Execute shell  
**Prioridade:** 🔥 CRÍTICO  

🚀 **Em 5 minutos o login estará funcional!**
