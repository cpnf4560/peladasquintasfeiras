# 🔧 CORREÇÃO URGENTE - FILIPE E LEONARDO NA CONVOCATÓRIA

## ⚠️ PROBLEMA
Filipe Garcês e Leonardo Sousa não aparecem na convocatória apesar de existirem na base de dados.

## ✅ SOLUÇÃO RÁPIDA (30 SEGUNDOS)

### Opção 1: Duplo Clique (RECOMENDADO)
```
📂 Abrir pasta: c:\Users\carlo\Documents\futsal-manager
📄 Duplo clique em: ADICIONAR_FILIPE_LEONARDO.bat
```

### Opção 2: Linha de Comando
```powershell
cd c:\Users\carlo\Documents\futsal-manager
node add_filipe_leonardo.js
```

---

## 📊 O QUE O SCRIPT FAZ

1. ✅ Busca Filipe Garcês e Leonardo Sousa na base
2. ✅ Verifica se já estão na convocatória
3. ✅ Se não estiverem, adiciona como RESERVAS
4. ✅ Atribui posições automaticamente
5. ✅ Mostra resumo final

---

## 🔍 VERIFICAR SE FUNCIONOU

### Depois de executar o script:

1. **Iniciar servidor:**
   ```
   Duplo clique: INICIAR_SERVIDOR.bat
   ```

2. **Abrir navegador:**
   ```
   http://localhost:3000
   ```

3. **Ir para Convocatória:**
   - Menu > Convocatória
   - Verificar se aparecem 20 jogadores
   - Filipe e Leonardo devem aparecer como RESERVAS

---

## 📋 SCRIPTS CRIADOS

| Script | Função |
|--------|--------|
| `add_filipe_leonardo.js` | Adiciona os 2 jogadores à convocatória |
| `ADICIONAR_FILIPE_LEONARDO.bat` | Executar com duplo clique |
| `diagnostico_convocatoria.js` | Diagnóstico completo |
| `DIAGNOSTICO.bat` | Diagnóstico com duplo clique |
| `add_to_convocatoria.sql` | Queries SQL manuais |

---

## 🆘 SE NÃO FUNCIONAR

### Opção A: Diagnóstico Completo
```
Duplo clique: DIAGNOSTICO.bat
```

Isto vai criar um ficheiro `diagnostico_output.txt` com informação detalhada.

### Opção B: SQL Manual (SQLite Browser)

1. Instalar [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Abrir `futsal.db`
3. Executar SQL (tab "Execute SQL"):

```sql
-- Ver IDs dos jogadores
SELECT id, nome FROM jogadores 
WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- Adicionar Filipe (substitua XX pelo ID real)
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
VALUES (XX, 'reserva', 11, 0);

-- Adicionar Leonardo (substitua YY pelo ID real)
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
VALUES (YY, 'reserva', 12, 0);
```

### Opção C: Reset Completo da Convocatória (ÚLTIMA OPÇÃO)

⚠️ **CUIDADO:** Isto vai resetar toda a convocatória!

1. Aceder: http://localhost:3000/convocatoria
2. Login como admin
3. Clicar em "Resetar"
4. Confirmar

Isto vai recriar a convocatória com os 20 jogadores em ordem alfabética.

---

## 💡 POR QUE ISTO ACONTECEU?

Possíveis causas:
1. ❌ Jogadores adicionados recentemente mas não incluídos na convocatória
2. ❌ Problema na query de detecção automática
3. ❌ Registros órfãos na tabela convocatoria

---

## ✅ VERIFICAÇÃO FINAL

Após executar a correção, verificar:

- [ ] Duplo clique em `ADICIONAR_FILIPE_LEONARDO.bat`
- [ ] Ver mensagem: "✅ PROCESSO CONCLUÍDO!"
- [ ] Iniciar servidor: `INICIAR_SERVIDOR.bat`
- [ ] Aceder: http://localhost:3000/convocatoria
- [ ] Verificar: 20 jogadores aparecem (10 convocados + 10 reservas)
- [ ] Confirmar: Filipe e Leonardo estão na lista de RESERVAS

---

## 🌐 NO RENDER (PRODUÇÃO)

Se o problema também acontece no Render:

1. Aceder: https://dashboard.render.com/
2. PostgreSQL > Query
3. Executar:

```sql
-- Ver IDs
SELECT id, nome FROM jogadores 
WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa');

-- Adicionar à convocatória (ajustar IDs)
INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva', 
  (SELECT COALESCE(MAX(posicao), 0) + 1 FROM convocatoria WHERE tipo = 'reserva'),
  0
FROM jogadores 
WHERE nome = 'Filipe Garcês'
  AND NOT EXISTS (SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id);

INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado)
SELECT id, 'reserva',
  (SELECT COALESCE(MAX(posicao), 0) + 1 FROM convocatoria WHERE tipo = 'reserva'),
  0
FROM jogadores 
WHERE nome = 'Leonardo Sousa'
  AND NOT EXISTS (SELECT 1 FROM convocatoria WHERE jogador_id = jogadores.id);
```

4. Depois sincronizar localmente:
   ```
   Duplo clique: SYNC.bat
   ```

---

## 📞 RESUMO

### COMECE AQUI:
```
1. Duplo clique: ADICIONAR_FILIPE_LEONARDO.bat
2. Aguardar mensagem de sucesso
3. Duplo clique: INICIAR_SERVIDOR.bat
4. Abrir: http://localhost:3000/convocatoria
5. Verificar se aparecem os 20 jogadores
```

**Tempo estimado:** 1 minuto

---

**Criado em:** ${new Date().toLocaleString('pt-PT')}  
**Status:** 🔧 Correção Urgente
