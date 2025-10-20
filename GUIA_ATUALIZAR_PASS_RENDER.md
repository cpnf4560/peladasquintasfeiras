# 🔐 ATUALIZAR PASSWORD DO PRESIDENTE NO RENDER

## ✅ SITUAÇÃO ATUAL
- **Local (SQLite):** Password atualizada para `bodelos` ✅
- **Render (PostgreSQL):** Ainda usa password antiga `Bodelos123*`

## 📋 PASSO-A-PASSO

### **Opção 1: Usar Script Automático (RECOMENDADO)**

#### 1️⃣ Obter a DATABASE_URL do Render
1. Acede ao [Render Dashboard](https://dashboard.render.com/)
2. Vai ao teu **PostgreSQL Database**
3. No separador **Info**, procura **Internal Database URL**
4. Clica em **Copy** (ícone ao lado)
5. A URL tem este formato:
   ```
   postgresql://user:password@host/database
   ```

#### 2️⃣ Executar o Script
Abre o PowerShell na pasta do projeto e executa:

```powershell
# Definir a DATABASE_URL (substitui pelo valor real)
$env:DATABASE_URL = "postgresql://user:password@host/database"

# Executar o script
node atualizar_pass_render.js
```

**OU** usa o ficheiro batch (mais fácil):
```cmd
ATUALIZAR_PASS_RENDER.bat
```

#### 3️⃣ Verificar
O script vai:
- ✅ Conectar ao PostgreSQL do Render
- ✅ Gerar o hash bcrypt de "bodelos"
- ✅ Atualizar a password do utilizador "presidente"
- ✅ Verificar se a atualização foi bem-sucedida

---

### **Opção 2: Atualizar via Código na Aplicação**

Se preferires, podemos criar uma rota temporária na aplicação que faz a atualização:

1. Adicionar rota `/admin/reset-password-presidente`
2. Aceder à rota no Render (ex: `https://tua-app.onrender.com/admin/reset-password-presidente`)
3. A rota atualiza a password e depois remove-se o código

Queres que crie esta opção alternativa?

---

## 🔑 CREDENCIAIS FINAIS

Após a atualização:
- **Utilizador:** `presidente`
- **Password:** `bodelos`
- **Hash:** `$2b$10$RwUCZhuYhPsqcNsMyz8g6ee992NKBT4KOihedr4zMG4YWQrqDrxZi`

---

## ⚠️ NOTAS IMPORTANTES

1. **Segurança:** Nunca comites a DATABASE_URL no Git!
2. **Temporário:** Usa a variável de ambiente apenas durante a execução
3. **Verificação:** Testa o login após a atualização
4. **Backup:** Se algo correr mal, a password antiga ainda funciona até executares o script

---

## 🐛 TROUBLESHOOTING

### Erro: "DATABASE_URL não encontrada"
```powershell
# PowerShell
$env:DATABASE_URL = "cola_aqui_a_url"

# CMD
set DATABASE_URL=cola_aqui_a_url
```

### Erro: "Connection timeout"
- Verifica se a DATABASE_URL está correta
- Confirma que o PostgreSQL do Render está ativo (pode demorar uns segundos a acordar)

### Erro: "SSL error"
- O script já está configurado para aceitar SSL auto-assinado
- Se persistir, verifica a conexão do Render

---

## 📞 PRECISA DE AJUDA?

Se tiveres problemas, posso criar uma rota administrativa temporária na aplicação para fazer a atualização remotamente. É só pedires! 🚀
