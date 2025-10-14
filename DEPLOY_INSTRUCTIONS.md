# 🚀 INSTRUÇÕES DE DEPLOY - RAILWAY

## Passos para Deploy Online:

### 1. **Aceder ao Railway**
- Ir para: https://railway.app
- Fazer login com GitHub

### 2. **Criar Novo Projeto**
- Clicar "New Project"
- Escolher "Deploy from GitHub repo"
- Conectar este repositório

### 3. **Configurar Variáveis de Ambiente**
No Railway, na aba "Variables", adicionar:

```
NODE_ENV=production
SESSION_SECRET=futsal-manager-ultra-secure-production-key-2025
PORT=3000
```

### 4. **Deploy Automático**
- Railway fará o deploy automaticamente
- URL será gerada automaticamente

### 5. **Testar Aplicação**
Contas de teste:
- **admin1** / **admin123**
- **user1** / **user**

## 🔧 Comandos Git (já executados):

```bash
git init
git add .
git commit -m "Deploy: Futsal Manager com sistema de autenticação completo"
```

## 📱 Próximos Passos Após Deploy:

1. **Testar todas as funcionalidades**
2. **Partilhar URL com utilizadores**
3. **Monitorizar logs no Railway**
4. **Considerar Progressive Web App (PWA)**

---

## 🎯 Estado Atual:
✅ Projeto preparado para deploy
✅ Git configurado
✅ Arquivos limpos
✅ Servidor testado localmente
🚀 Pronto para Railway!
