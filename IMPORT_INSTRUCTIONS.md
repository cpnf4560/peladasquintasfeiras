# Instruções para Importar Histórico no Render

## Opção 1: Via Render Console (Recomendado)

1. Acede ao dashboard do Render
2. Vai ao teu serviço web
3. Clica em "Shell" no menu lateral
4. Executa o comando:
```bash
node import_historico_manual.js
```

## Opção 2: Via Deploy

1. Faz commit e push do ficheiro `import_historico_manual.js`
2. Aguarda o deploy
3. Acede ao Shell do Render e executa o comando acima

## Opção 3: Executar Localmente (se tiveres DATABASE_URL)

Se tiveres a variável DATABASE_URL do PostgreSQL:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://..."
node import_historico_manual.js

# Linux/Mac
DATABASE_URL="postgresql://..." node import_historico_manual.js
```

## O que o script faz:

1. Carrega todos os jogadores da base de dados
2. Para cada jogo nas imagens:
   - Insere o jogo (data e resultado)
   - Insere as presenças de cada jogador em cada equipa
3. Mostra logs detalhados do progresso

## Dados a importar:

- 14 jogos (de 24/04/2025 a 31/07/2025)
- ~70 presenças (5 jogadores por equipa em média)

## Verificação pós-importação:

Após executar, verifica:
1. Histórico de Resultados - devem aparecer todos os jogos
2. Estatísticas - devem ser calculadas corretamente
3. Logs do script - confirma "Sucessos: 14/14"

## Troubleshooting:

Se aparecer "Jogador não encontrado":
- Verifica o nome exato na tabela jogadores
- Pode ser necessário adicionar o jogador primeiro
- O script continua mesmo que falte algum jogador

## Alternativa: SQL Direto

Se preferires, podes também executar SQL direto no Render PostgreSQL.
Vou criar um ficheiro SQL separado se quiseres.
