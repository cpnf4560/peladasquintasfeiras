# 🚀 DEPLOY NO RAILWAY - INSTRUÇÕES FINAIS

## ✅ **PROJETO PRONTO NO GITHUB:**
- **Repositório:** https://github.com/cpnf4560/peladasquintasfeiras
- **Branch:** main
- **Último commit:** Ready for Railway deploy

---

## 🌐 **PASSOS NO RAILWAY (https://railway.app):**

### **1. LOGIN & SETUP**
1. Clicar **"Login"** 
2. Escolher **"Login with GitHub"**
3. Autorizar Railway a aceder aos seus repositórios

### **2. CRIAR PROJETO**
1. Clicar **"New Project"** 
2. Selecionar **"Deploy from GitHub repo"**
3. Escolher **"cpnf4560/peladasquintasfeiras"**
4. Clicar **"Deploy Now"**

### **3. CONFIGURAR VARIÁVEIS (IMPORTANTE!)**
1. Ir para o projeto criado
2. Clicar na aba **"Variables"** 
3. Adicionar estas variáveis:

```
NODE_ENV=production
SESSION_SECRET=futsal-manager-ultra-secure-railway-2025
PORT=3000
```

### **4. AGUARDAR DEPLOY**
- Railway detecta automaticamente Node.js
- Instala dependências automaticamente  
- Deploy demora ~3-5 minutos
- URL será gerado automaticamente (ex: `https://xxx-production.up.railway.app`)

---

## 🔐 **CONTAS PARA TESTAR:**

### **ADMINISTRADORES:**
- **admin1** / **admin123** ← Acesso completo
- **admin2** / **admin** ← Acesso completo

### **UTILIZADORES NORMAIS:**
- **user1** / **user** ← Dashboard personalizado
- **user2** / **user** ← Dashboard personalizado
- ... até **user19** / **user**

---

## 📱 **O QUE TESTAR APÓS DEPLOY:**

### **✅ COMO ADMIN:**
1. Login com **admin1/admin123**
2. Testar gestão de jogadores
3. Criar novo jogo
4. Verificar convocatórias
5. Logout

### **✅ COMO USER:**
1. Login com **user1/user**  
2. Ver dashboard personalizado
3. Verificar estatísticas
4. Consultar convocatórias
5. Logout

---

## 💰 **CUSTOS RAILWAY FREE:**
- **$5 gratuitos/mês** (mais que suficiente!)
- **Estimativa real:** ~$1-2/mês
- **500 horas/mês** (~20 dias online)

---

## 🚨 **SE ALGO CORRER MAL:**
1. Verificar logs no Railway (aba "Deployments")
2. Confirmar variáveis de ambiente
3. Verificar se branch "main" está selecionada

---

## 🎯 **APÓS DEPLOY BEM-SUCEDIDO:**
1. **Copiar URL gerada** (ex: https://xxx.up.railway.app)
2. **Partilhar com a equipa**
3. **Testar em diferentes dispositivos**
4. **Monitorizar uso** na dashboard do Railway

---

**🚀 EM ~10 MINUTOS TERÁ A APLICAÇÃO ONLINE!**

**Repositório:** https://github.com/cpnf4560/peladasquintasfeiras
**Railway:** https://railway.app
