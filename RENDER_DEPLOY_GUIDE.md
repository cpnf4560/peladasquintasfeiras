# 🌟 RENDER DEPLOY - ALTERNATIVA GRATUITA AO RAILWAY

## 🚨 **PROBLEMA RAILWAY:**
- Railway Free agora só permite bases de dados
- Aplicações Node.js precisam de plano pago

## ✅ **SOLUÇÃO: RENDER.COM**
- **100% GRATUITO para sempre**
- **750 horas/mês** (mais que Railway!)
- **Sem limites de projetos**
- **Deploy automático do GitHub**

---

## 🚀 **DEPLOY NO RENDER - PASSO A PASSO:**

### **1. ACEDER AO RENDER**
- Ir para: **https://render.com**
- Clicar **"Get Started for Free"**
- **Login with GitHub**

### **2. CRIAR WEB SERVICE**
1. Clicar **"New +"** (botão azul)
2. Escolher **"Web Service"**
3. Conectar **GitHub** (se ainda não conectado)
4. Procurar e selecionar: **"peladasquintasfeiras"**
5. Clicar **"Connect"**

### **3. CONFIGURAR SERVIÇO**

**Nome:** `futsal-manager` (ou outro à escolha)

**Root Directory:** (deixar vazio)

**Environment:** `Node`

**Build Command:** `npm install && npm rebuild sqlite3`

**Start Command:** `npm start`

**Instance Type:** `Free` ✅

### **4. ADICIONAR VARIÁVEIS DE AMBIENTE**

Na secção **"Environment Variables"**:

```
NODE_ENV = production
SESSION_SECRET = futsal-manager-ultra-secure-render-2025
```

⚠️ **IMPORTANTE:** 
- **NÃO adicionar PORT** - Render define automaticamente
- Render usa porta dinâmica (pode ser 10000, 8080, ou outra)
- O nosso código já está preparado: `const PORT = process.env.PORT || 3000;`

### **5. DEPLOY**
- Clicar **"Create Web Service"**
- Deploy automático inicia
- Demora ~5-10 minutos
- URL gerado: `https://futsal-manager.onrender.com`

---

## 🎯 **VANTAGENS DO RENDER:**

### ✅ **vs RAILWAY:**
- **Gratuito** vs Pago
- **750h/mês** vs 500h/mês  
- **Mais estável** para projetos pequenos
- **Deploy mais rápido**

### ✅ **FUNCIONALIDADES:**
- ✅ **SSL automático** (HTTPS)
- ✅ **Deploy automático** do GitHub
- ✅ **Logs em tempo real**
- ✅ **Custom domains** (grátis)
- ✅ **Auto-sleep** (economiza recursos)

---

## 🔐 **CONTAS PARA TESTAR:**
- **Admin:** admin1 / admin123
- **User:** user1 / user

## ⏱️ **TEMPO TOTAL:** ~10-15 minutos

---

## 🚀 **ALTERNATIVAS SE RENDER TAMBÉM FALHAR:**

### **OPÇÃO 2: CYCLIC.SH**
- Gratuito, simples, rápido
- https://app.cyclic.sh

### **OPÇÃO 3: GLITCH.COM** 
- Gratuito, fácil de usar
- https://glitch.com

### **OPÇÃO 4: FLY.IO**
- $0 até certo usage
- https://fly.io

---

**🎯 RECOMENDAÇÃO: COMEÇAR COM RENDER!**
**É a melhor alternativa gratuita ao Railway para 2025.**
