# 🚀 ATIVAR LOGIN NO RENDER

## ⚠️ PROBLEMA
O login não funciona no Render porque os utilizadores ainda não foram criados na base de dados PostgreSQL.

---

## ✅ SOLUÇÃO - 3 OPÇÕES

### **OPÇÃO 1: Via Render Shell (Recomendado)** 🎯

#### Passo 1: Aceder ao Shell do Render
```
1. Aceda: https://dashboard.render.com
2. Selecione o seu serviço "peladasquintasfeiras"
3. No topo, clique no tab "Shell"
4. Aguarde o shell carregar
```

#### Passo 2: Executar Script
```bash
node setup_render_users.js
```

#### Resultado Esperado:
```
🔧 CONFIGURANDO UTILIZADORES NO RENDER...
1️⃣ Limpando utilizadores antigos...
✅ Utilizadores antigos removidos
2️⃣ Criando novos utilizadores...
✅ Utilizador criado: presidente (admin)
✅ Utilizador criado: admin (admin)
3️⃣ Verificando utilizadores...
📋 UTILIZADORES ATIVOS:
══════════════════════════════════════════════════
👤 admin                | 🔐 admin
👤 presidente           | 🔐 admin
══════════════════════════════════════════════════
✅ ATUALIZAÇÃO COMPLETA NO RENDER!
```

#### Passo 3: Testar Login
```
1. Aceda: https://peladasquintasfeiras.onrender.com/login
2. Use: admin / rzq7xgq8
3. ✅ Login deve funcionar!
```

---

### **OPÇÃO 2: Automático no Próximo Deploy** 🔄

O `server.js` já cria os utilizadores automaticamente se a tabela estiver vazia.

#### Como Forçar:
```
1. Fazer qualquer commit (ex: adicionar espaço num comentário)
2. Push para GitHub
3. Render faz deploy automático
4. Utilizadores serão criados na inicialização
```

**⚠️ NOTA:** Só funciona se a tabela `users` estiver vazia!

---

### **OPÇÃO 3: Via SQL Direto no Render** 💾

#### Passo 1: Gerar Hashes das Passwords
Execute localmente:
```powershell
node -e "const bcrypt = require('bcrypt'); console.log('presidente:', bcrypt.hashSync('Bodelos123*', 10)); console.log('admin:', bcrypt.hashSync('rzq7xgq8', 10));"
```

#### Passo 2: Aceder à Base de Dados
```
1. Render Dashboard → PostgreSQL database
2. Info → Connect → External Connection
3. Copiar credenciais
```

#### Passo 3: Executar SQL
Via terminal local com `psql` ou ferramenta GUI:
```sql
-- Limpar utilizadores antigos
DELETE FROM users;

-- Inserir presidente (substitua HASH_AQUI pelo hash gerado)
INSERT INTO users (username, password, role) 
VALUES ('presidente', 'HASH_AQUI', 'admin');

-- Inserir admin (substitua HASH_AQUI pelo hash gerado)
INSERT INTO users (username, password, role) 
VALUES ('admin', 'HASH_AQUI', 'admin');

-- Verificar
SELECT username, role FROM users;
```

---

## 🔐 CREDENCIAIS

Após configurar, use estas credenciais:

| Utilizador | Palavra-passe | Papel |
|-----------|---------------|-------|
| `presidente` | `Bodelos123*` | admin |
| `admin` | `rzq7xgq8` | admin |

---

## 🧪 TESTAR

### URL de Login:
```
https://peladasquintasfeiras.onrender.com/login
```

### Checklist:
- [ ] Página de login carrega (design moderno roxo)
- [ ] Login com `admin` / `rzq7xgq8` funciona
- [ ] Login com `presidente` / `Bodelos123*` funciona
- [ ] Redireciona para dashboard após login
- [ ] Sem erro "Utilizador não encontrado"

---

## 🐛 TROUBLESHOOTING

### Erro: "Utilizador não encontrado"
**Causa:** Utilizadores não existem na BD do Render  
**Solução:** Execute OPÇÃO 1 (Render Shell)

### Erro: "Senha inválida"
**Causa:** Hash da senha incorreto  
**Solução:** Re-execute o script para recriar hashes

### Shell não disponível no Render
**Causa:** Plano gratuito pode ter limitações  
**Solução:** Use OPÇÃO 3 (SQL direto)

### Tabela users não existe
**Causa:** Migração não executada  
**Solução:** 
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 STATUS ATUAL

### Localhost
- ✅ Utilizadores criados
- ✅ Login funcionando
- ✅ Script `atualizar_utilizadores.js` OK

### Render
- ⏳ Aguardando configuração
- ⏳ Utilizadores não criados ainda
- 🎯 **Execute OPÇÃO 1 agora!**

---

## ⚡ AÇÃO IMEDIATA

**FAÇA AGORA:**

1. Aceda ao Render Dashboard
2. Abra o Shell do serviço
3. Execute: `node setup_render_users.js`
4. Teste o login

**Tempo estimado:** 2 minutos

---

## 📝 NOTAS

- O script `setup_render_users.js` já foi criado e commitado
- Ele usa PostgreSQL (`pg`) em vez de SQLite
- As passwords são as mesmas do localhost
- Os hashes são gerados automaticamente

---

**Status:** 🎯 PRONTO PARA EXECUTAR  
**Prioridade:** 🔥 ALTA  
**Ação:** Execute OPÇÃO 1 no Render Shell  

🚀 **Após executar, o login estará funcional no Render!**
