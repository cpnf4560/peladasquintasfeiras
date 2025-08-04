# 🏆 Peladas das Quintas Feiras - Gestor de Futsal

**Aplicação web completa para gestão de jogos de futsal**

## 📋 Funcionalidades

### ⚽ Gestão de Jogos
- ✅ Criar novos jogos com equipas e resultados
- ✅ Visualizar histórico completo de jogos
- ✅ Ver detalhes de cada jogo (jogadores, equipas, resultado)
- ✅ Eliminar jogos com confirmação

### 👥 Gestão de Jogadores
- ✅ Adicionar/remover jogadores
- ✅ Editar nomes dos jogadores
- ✅ Sistema de ativação/inativação
- ✅ Interface moderna e intuitiva

### 🦺 Sistema de Coletes
- ✅ Controlo de rotação dos coletes
- ✅ Estatísticas de prioridade (quem levou menos vezes)
- ✅ Atribuição e devolução automática
- ✅ Sugestões baseadas na prioridade

### 📊 Estatísticas Completas
- ✅ Estatísticas por jogador (jogos, vitórias, empates, derrotas)
- ✅ Percentagem de vitórias
- ✅ Golos marcados e sofridos
- ✅ Diferença de golos com indicadores visuais
- ✅ Filtros por ano e mês

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express.js
- **Base de Dados**: SQLite3
- **Frontend**: EJS (templates)
- **Styling**: CSS customizado com tema escuro
- **Tipografia**: Google Fonts (Montserrat)

## 🗄️ Estrutura da Base de Dados

### Tabelas:
- `jogadores` - Informações dos jogadores
- `jogos` - Dados dos jogos (data, resultados)
- `presencas` - Relação jogadores/jogos/equipas
- `coletes` - Histórico de uso dos coletes

## 🚀 Como Executar

1. Instalar dependências:
```bash
npm install
```

2. Executar o servidor:
```bash
node server.js
```

3. Abrir no navegador:
```
http://localhost:3000
```
- Interface web simples

## Como usar

1. Instalar dependências:
   ```
   npm install
   ```

2. Iniciar servidor:
   ```
   npm start
   ```

3. Aceder via browser:
   ```
   http://localhost:3000
   ```

## Estrutura

- `/jogadores` — gestão de jogadores
- `/jogos/novo` — registo de novo jogo
- `/` — histórico de jogos
- `/estatisticas` — estatísticas coletivas

## Stack

- Node.js + Express + SQLite
- EJS para frontend simples

---

Qualquer sugestão ou dúvida, é só avisar!