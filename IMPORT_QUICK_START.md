# 🚀 IMPORTAÇÃO RÁPIDA - INSTRUÇÕES

## ✅ O QUE FAZER AGORA

### 1. Aguardar Deploy no Render
- O Render vai fazer deploy automático (~2-3 minutos)
- Podes acompanhar em: https://dashboard.render.com

### 2. Aceder à Página de Importação
Quando o deploy terminar, abre no browser:

```
https://peladasquintasfeiras.onrender.com/admin/import-history
```

### 3. Executar Importação
1. ✅ Revê a lista dos 14 jogos
2. ✅ Clica em **"Confirmar Importação"**
3. ✅ Aguarda 30-60 segundos
4. ✅ Vê o resultado com log detalhado

### 4. Validar Resultado
Depois da importação:
- Vai para a página principal
- Confirma que aparecem **14 cards** de resultados
- Verifica que as estatísticas estão corretas

---

## 📊 O QUE VAI SER IMPORTADO

**14 jogos** de 24/04/2025 a 31/07/2025  
**~139 presenças** de jogadores  
**Todos os resultados** com equipas completas

---

## ⚠️ IMPORTANTE

- Executa isto **apenas 1 vez**
- Não atualizes a página durante a importação
- Se houver erro, contacta-me antes de tentar novamente

---

## 🎯 PRÓXIMO PASSO

Após a importação bem-sucedida, **PODES APAGAR** esta rota de admin editando o `server.js` e removendo:

```javascript
// ROTAS ADMIN (temporárias para importação)
app.use('/admin', adminRoutes);
```

E apagando o ficheiro `routes/admin.js`.

---

**Boa sorte!** 🍀
