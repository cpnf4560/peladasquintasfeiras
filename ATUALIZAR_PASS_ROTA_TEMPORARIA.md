# 🔐 ATUALIZAR PASSWORD DO PRESIDENTE - ROTA TEMPORÁRIA

## ✅ SOLUÇÃO MAIS FÁCIL (Sem DATABASE_URL)

Criei uma **rota administrativa temporária** que atualiza a password automaticamente quando acedes pelo browser.

---

## 📋 PASSO-A-PASSO

### **1️⃣ Fazer Deploy**
```powershell
git add .
git commit -m "feat: Adicionar rota temporária para atualizar password presidente"
git push
```

### **2️⃣ Aguardar Deploy no Render**
- Vai ao [Render Dashboard](https://dashboard.render.com/)
- Aguarda que o deploy automático termine (±2-3 minutos)
- Quando aparecer **"Live"** com ✅ verde, está pronto

### **3️⃣ Aceder à Rota Temporária**
Abre no browser:
```
https://tua-app.onrender.com/admin/reset-password-presidente-bodelos-2025
```

**Substitui `tua-app` pelo nome real da tua aplicação no Render!**

### **4️⃣ Verificar Sucesso**
Verás uma página com:
- ✅ Confirmação de sucesso
- 📋 Novas credenciais (presidente / bodelos)
- 🔐 Botão "Testar Login Agora"

### **5️⃣ Testar Login**
1. Clica no botão **"Testar Login Agora"**
2. Faz login com:
   - **Utilizador:** `presidente`
   - **Password:** `bodelos`
3. ✅ Se funcionar, está tudo OK!

### **6️⃣ REMOVER A ROTA (SEGURANÇA)** ⚠️
**IMPORTANTE:** Por segurança, remove a rota depois de usar!

No ficheiro `routes/admin.js`, **apaga todo o bloco**:
```javascript
// ============================================
// ROTA TEMPORÁRIA: ATUALIZAR PASSWORD PRESIDENTE
// ============================================
// ... (todo o código até "// ...existing code...")
```

Depois:
```powershell
git add .
git commit -m "security: Remover rota temporária de atualização de password"
git push
```

---

## 🎯 CREDENCIAIS FINAIS

Após a atualização:
- **Utilizador:** `presidente`
- **Password:** `bodelos`
- **Hash bcrypt:** `$2b$10$...` (gerado automaticamente)

---

## 🐛 TROUBLESHOOTING

### ❌ Erro 404 - Página não encontrada
**Causa:** Deploy ainda não terminou ou URL errada
**Solução:** 
1. Verifica se o deploy está **Live** no Render
2. Confirma que a URL está correta

### ❌ Erro 500 - Internal Server Error
**Causa:** Problema com a base de dados
**Solução:** Verifica os logs no Render Dashboard

### ⚠️ Utilizador "presidente" não encontrado
**Causa:** Utilizador não existe na base de dados do Render
**Solução:** Precisa criar o utilizador primeiro (contacta-me)

---

## 📊 VANTAGENS DESTA SOLUÇÃO

✅ **Simples:** Apenas aceder a uma URL  
✅ **Sem Configuração:** Não precisa de DATABASE_URL  
✅ **Segura:** Usa bcrypt com salt rounds  
✅ **Visual:** Página HTML bonita com confirmação  
✅ **Informativa:** Mostra hash e timestamp  
✅ **Reversível:** Pode ser testada localmente antes  

---

## 🧪 TESTAR LOCALMENTE (OPCIONAL)

Antes de fazer deploy, podes testar localmente:

```powershell
# Iniciar servidor
npm start

# Aceder no browser
http://localhost:3000/admin/reset-password-presidente-bodelos-2025
```

Isto atualiza a password no SQLite local. Se funcionar, vai funcionar no Render! 🚀

---

## ✨ PRÓXIMOS PASSOS

1. ✅ **Agora:** Fazer commit e push
2. ⏳ **Aguardar:** Deploy automático do Render
3. 🌐 **Aceder:** URL da rota temporária
4. 🔐 **Testar:** Login com `presidente` / `bodelos`
5. 🗑️ **Limpar:** Remover a rota temporária

---

**Boa sorte! 🎉**
