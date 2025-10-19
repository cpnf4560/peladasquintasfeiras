# 🎯 GUIA VISUAL - EXECUTAR SQL NO RENDER

> **Passo a passo com capturas de tela descritivas**

---

## 📍 PASSO 1: ACEDER AO RENDER DASHBOARD

### 1.1 Abrir o navegador
```
https://dashboard.render.com/
```

### 1.2 Fazer Login
- Email: (seu email)
- Senha: (sua senha)
- Clicar em **"Sign In"**

---

## 📍 PASSO 2: ENCONTRAR O BANCO DE DADOS

### 2.1 Na página inicial do Dashboard

Você verá algo como:

```
┌─────────────────────────────────────┐
│  RENDER DASHBOARD                   │
├─────────────────────────────────────┤
│                                     │
│  🔷 Web Services                    │
│  ├─ futsal-manager (ou seu app)    │
│                                     │
│  🗄️  PostgreSQL                     │
│  ├─ futsal-db (ou nome do seu DB)  │  ← CLICAR AQUI!
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Clicar no banco de dados PostgreSQL
- Procure por algo como:
  - `futsal-db`
  - `peladasquintasfeiras`
  - `postgres-xxxx`
- Tem o ícone 🗄️ ou símbolo de PostgreSQL

---

## 📍 PASSO 3: ABRIR O QUERY EDITOR

### 3.1 Dentro da página do banco de dados

Você verá várias abas no topo:

```
┌───────────────────────────────────────────────────┐
│  Info | Connect | Backups | Settings | Metrics   │
└───────────────────────────────────────────────────┘
```

### 3.2 Clicar em **"Connect"**

Dentro da aba Connect, você verá:

```
┌─────────────────────────────────────────────┐
│  External Connection String                 │
│  postgres://user:pass@host/db               │
│                                             │
│  🔧 PSQL Command                            │
│  psql -h host -U user -d db                 │
│                                             │
│  💻 Shell Access                            │
│  [Open Shell] ← CLICAR AQUI!                │
└─────────────────────────────────────────────┘
```

### 3.3 Clicar no botão **"Open Shell"**

Isto vai abrir um terminal no navegador!

---

## 📍 PASSO 4: EXECUTAR COMANDOS SQL

### 4.1 No Shell que abriu

Você verá algo assim:

```bash
postgres=# _
```

### 4.2 Para limpar faltas, digite:

```sql
DELETE FROM faltas_historico;
```

Pressione **Enter**

### 4.3 Verificar resultado:

```sql
SELECT COUNT(*) FROM faltas_historico;
```

Deve retornar: `0`

---

## 🎯 ALTERNATIVA: USAR CLIENTE SQL

Se o shell não funcionar, use um cliente PostgreSQL:

### Opção A: pgAdmin (GUI)
1. Baixar: https://www.pgadmin.org/download/
2. Instalar
3. Conectar usando a connection string do Render

### Opção B: DBeaver (Recomendado)
1. Baixar: https://dbeaver.io/download/
2. Instalar
3. New Connection > PostgreSQL
4. Copiar dados do Render:
   - Host
   - Port
   - Database
   - Username
   - Password

### Opção C: Terminal Local (psql)

Se tiver PostgreSQL instalado localmente:

1. Copiar connection string do Render
2. No terminal:
   ```bash
   psql "postgres://user:pass@host:port/database"
   ```

---

## 🔍 LOCALIZAÇÃO EXATA NO RENDER

### Layout Típico do Render Dashboard:

```
┌─────────────────────────────────────────────────────┐
│ [Render Logo]  Dashboard  [User Menu]              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📌 SIDEBAR (Esquerda)                             │
│  ├─ Dashboard                                      │
│  ├─ Web Services                                   │
│  ├─ Static Sites                                   │
│  ├─ PostgreSQL  ← CLICAR AQUI                     │
│  ├─ Redis                                          │
│  └─ ...                                            │
│                                                     │
│  📄 MAIN AREA (Centro)                             │
│  ┌───────────────────────────────────────┐        │
│  │ PostgreSQL: futsal-db                 │        │
│  ├───────────────────────────────────────┤        │
│  │ Info | Connect | Backups | ...        │ ← ABAS│
│  ├───────────────────────────────────────┤        │
│  │                                       │        │
│  │ [Open Shell] ← BOTÃO AQUI!           │        │
│  │                                       │        │
│  └───────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

---

## 📝 PASSO A PASSO RESUMIDO

1. ✅ Ir para: https://dashboard.render.com/
2. ✅ Login
3. ✅ Clicar em **"PostgreSQL"** (sidebar esquerda)
4. ✅ Clicar no seu banco de dados (lista)
5. ✅ Clicar na aba **"Connect"**
6. ✅ Clicar no botão **"Open Shell"**
7. ✅ Aguardar shell abrir no navegador
8. ✅ Digitar: `DELETE FROM faltas_historico;`
9. ✅ Pressionar Enter
10. ✅ Verificar: `SELECT COUNT(*) FROM faltas_historico;`

---

## 🆘 SE NÃO ENCONTRAR O BOTÃO

### Opção 1: Usar a Connection String

1. Na aba **"Connect"**, copiar a **External Connection String**
   
   Algo como:
   ```
   postgres://user:password@dpg-xxx.oregon-postgres.render.com/dbname
   ```

2. Usar um cliente SQL (DBeaver, pgAdmin, ou psql)

3. Conectar e executar:
   ```sql
   DELETE FROM faltas_historico;
   ```

### Opção 2: API do Render

Se tiver acesso à API:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"DELETE FROM faltas_historico;"}' \
  https://api.render.com/v1/...
```

---

## 💡 DICA IMPORTANTE

### Se o Render mudou a interface:

Procure por:
- **"Shell"**
- **"Console"**
- **"Query Editor"**
- **"SQL Console"**
- **"Database Console"**

Geralmente está em:
- Aba **"Connect"**
- Ou dentro de **"Settings"**
- Ou menu **"Tools"** / **"Actions"**

---

## 🎯 ALTERNATIVA FÁCIL

### Use a aplicação para limpar!

#### No código, adicionar uma rota admin:

1. Aceder: https://seu-app.onrender.com/admin/limpar-faltas
2. Fazer login como admin
3. Clicar em botão "Limpar Faltas"

**Quer que eu crie esta rota?** Seria mais fácil que usar o SQL!

---

## 📸 REFERÊNCIAS VISUAIS

### Como deveria parecer:

```
Render Dashboard
├── Sidebar
│   ├── Dashboard
│   ├── Web Services
│   │   └── seu-app
│   └── PostgreSQL  ← AQUI!
│       └── seu-database
│           ├── Info
│           ├── Connect  ← E AQUI!
│           │   ├── Connection String
│           │   ├── PSQL Command
│           │   └── [Open Shell]  ← ESTE BOTÃO!
│           ├── Backups
│           └── Settings
```

---

## ✅ CHECKLIST

- [ ] Aceder a dashboard.render.com
- [ ] Fazer login
- [ ] Ver sidebar esquerda
- [ ] Clicar em "PostgreSQL"
- [ ] Selecionar seu banco de dados
- [ ] Clicar em aba "Connect"
- [ ] Procurar botão "Open Shell" ou similar
- [ ] Executar comando SQL

---

## 🔗 LINKS ÚTEIS

- Render Dashboard: https://dashboard.render.com/
- Render Docs - PostgreSQL: https://render.com/docs/databases
- DBeaver (cliente SQL): https://dbeaver.io/download/
- pgAdmin (cliente SQL): https://www.pgadmin.org/download/

---

## 📞 SE AINDA TIVER DÚVIDAS

### Posso criar uma rota web no seu app para:
- ✅ Limpar faltas via navegador
- ✅ Sem precisar de SQL
- ✅ Com autenticação admin
- ✅ Interface bonita

**Quer que eu crie isso?** É mais simples! 😊

---

**Criado em:** ${new Date().toLocaleString('pt-PT')}  
**Atualizado:** Para Render 2025
