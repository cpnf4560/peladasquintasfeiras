# 🎯 APLICAR CONFIGURAÇÃO DE COLETES NO RENDER

## ✅ O QUE FAZER

A configuração dos coletes precisa ser aplicada **diretamente no servidor Render** (onde está a base de dados PostgreSQL com os dados corretos).

---

## 📝 PASSO A PASSO

### 1. Fazer commit e push das alterações

```bash
git add package.json aplicar_coletes_postgres.js APLICAR_COLETES_RENDER.md
git commit -m "feat: Adicionar comando para configurar coletes no Render"
git push
```

### 2. Aguardar o deploy automático no Render
O Render vai fazer deploy automático após o push. Aguarda 2-3 minutos.

### 3. Executar o comando no Render

Como não tens acesso ao Shell (conta gratuita), vais usar uma **rota temporária**:

1. Vou criar uma rota GET `/admin/setup-coletes` que executa o script
2. Depois de fazer deploy, acede a: `https://teu-site.onrender.com/admin/setup-coletes`
3. O script será executado e verás o resultado na página
4. Depois remove a rota (por segurança)

---

## 🎯 O QUE O SCRIPT FAZ

1. ✅ Limpa a tabela `convocatoria`
2. ✅ Limpa a tabela `coletes`
3. ✅ Configura os 18 jogadores na ordem correta:
   - **Convocados (1-10):** Rogério, Cesaro, Carlos Silva, Nuno, Joel, Carlos Cruz, Joaquim, Ismael, João, Rui
   - **Reservas (11-18):** Ricardo, Valter, Serafim, Hugo, Paulo, Flávio, Manuel, Pedro
4. ✅ Adiciona histórico:
   - Rogério: levou 02/10, devolveu 09/10
   - Cesaro: levou 09/10, devolveu 16/10
   - Carlos Silva: TEM ATUALMENTE desde 16/10

---

## ⚠️ IMPORTANTE

- Este script usa **PostgreSQL** (Render), não SQLite (local)
- Só funciona quando executado no servidor Render
- Depois de executar, a página `/coletes` mostrará a ordem correta
- **NÃO é necessário fazer deploy novamente** - basta executar o script

---

## ✅ VERIFICAR SE FUNCIONOU

Depois de executar o script:
1. Acede a: https://teu-site.onrender.com/coletes
2. Verifica se a ordem está correta (Rogério em 1º, Cesaro em 2º, etc.)
3. Verifica se Carlos Silva aparece com "TEM COLETES" 

---

## 🚨 SE HOUVER ERRO

Se algum jogador não for encontrado (ex: "Cesaro" não existe como "Cesaro" mas como "Cesaro Santos"):
1. Copia o nome EXATO que aparece no erro
2. Edita o ficheiro `aplicar_coletes_postgres.js`
3. Ajusta o nome na lista `jogadoresOrdem`
4. Faz commit e push novamente
5. Executa o script outra vez no Render
