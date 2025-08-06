# 🎯 RAILWAY DEPLOY - GUIA VISUAL COMPLETO

## 🌐 **PASSO 1: ACEDER AO RAILWAY**
1. Ir para: **https://railway.app**
2. Clicar **"Login"**
3. Escolher **"Continue with GitHub"**
4. Autorizar Railway

## 📦 **PASSO 2: CRIAR PROJETO**
1. Clicar **"New Project"** (botão roxo grande)
2. Escolher **"Deploy from GitHub repo"** 
3. Procurar e selecionar: **"peladasquintasfeiras"**
4. Clicar **"Deploy"**

## ⚙️ **PASSO 3: ADICIONAR VARIÁVEIS (CRÍTICO!)**

### **3.1 Navegar para Variables:**
```
Dashboard do Projeto → Aba "Variables" (no menu superior)
```

### **3.2 Adicionar Variável 1:**
```
+ Add Variable

Nome:  NODE_ENV
Valor: production

[Save Variable]
```

### **3.3 Adicionar Variável 2:**
```
+ Add Variable

Nome:  SESSION_SECRET
Valor: futsal-manager-ultra-secure-railway-2025

[Save Variable]
```

### **3.4 Adicionar Variável 3:**
```
+ Add Variable

Nome:  PORT
Valor: 3000

[Save Variable]
```

## ✅ **PASSO 4: VERIFICAR DEPLOY**
1. Ir para aba **"Deployments"**
2. Aguardar status: **"SUCCESS ✅"**
3. Clicar no link gerado (ex: https://xxx.up.railway.app)

## 🔐 **PASSO 5: TESTAR APLICAÇÃO**

### **Login como Admin:**
- Utilizador: **admin1**
- Password: **admin123**

### **Login como User:**
- Utilizador: **user1** 
- Password: **user**

## ⏱️ **TEMPO TOTAL: ~10 MINUTOS**

---

## 🚨 **PROBLEMAS COMUNS:**

### **❌ Deploy falha:**
- Verificar se variáveis foram adicionadas
- Ver logs na aba "Deployments"
- Confirmar repositório correto

### **❌ Aplicação não carrega:**
- Aguardar 2-3 minutos após deploy
- Verificar URL gerado
- Tentar refresh da página

### **❌ Login não funciona:**
- Aplicação demora ~30 segundos a criar utilizadores na primeira execução
- Tentar aguardar e fazer refresh

---

## 📱 **APÓS DEPLOY BEM-SUCEDIDO:**
1. **Copiar URL** da aplicação
2. **Partilhar com a equipa**
3. **Testar em diferentes dispositivos**
4. **Monitorizar uso** no Railway dashboard

**🎉 APLICAÇÃO ESTARÁ ONLINE EM MINUTOS!**
