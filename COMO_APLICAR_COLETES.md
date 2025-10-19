# INSTRUÇÕES PARA APLICAR CONFIGURAÇÃO DE COLETES

## ⚠️ IMPORTANTE
A configuração de coletes foi preparada mas **NÃO FOI APLICADA** à base de dados.
Precisas executar um script manualmente para aplicar as alterações.

## 🚀 Como Aplicar

### Opção 1: Linha de Comando (Recomendado)

1. Abre PowerShell ou Terminal
2. Navega para a pasta do projeto:
   ```powershell
   cd c:\Users\carlo\Documents\futsal-manager
   ```

3. Executa o script:
   ```powershell
   node aplicar_coletes_agora.js
   ```

### Opção 2: Duplo Clique (Windows)

1. Vai à pasta: `c:\Users\carlo\Documents\futsal-manager`
2. Faz duplo clique em `APLICAR_COLETES.bat`
3. Aguarda a conclusão e pressiona qualquer tecla

---

## 📋 O Que o Script Faz

1. **Limpa** a convocatória existente
2. **Limpa** o histórico de coletes existente
3. **Insere** a nova ordem:
   ```
   1º  - Rogério (convocado)
   2º  - Cesaro (convocado)
   3º  - Carlos Silva (convocado) ← TEM ATUALMENTE
   4º  - Nuno (convocado)
   5º  - Joel (convocado)
   6º  - Carlos Cruz (convocado)
   7º  - Joaquim (convocado)
   8º  - Ismael (convocado)
   9º  - João (convocado)
   10º - Rui (convocado)
   11º - Ricardo (reserva)
   12º - Valter (reserva)
   13º - Serafim (reserva)
   14º - Hugo (reserva)
   15º - Paulo (reserva)
   16º - Flávio (reserva)
   17º - Manuel (reserva)
   18º - Pedro (reserva)
   ```

4. **Regista** histórico:
   - Rogério levou em 02/10/2024, devolveu em 09/10/2024
   - Cesaro levou em 09/10/2024, devolveu em 16/10/2024
   - Carlos Silva tem ATUALMENTE desde 16/10/2024

---

## ✅ Como Verificar se Funcionou

Após executar o script:

1. Abre o browser
2. Vai para: `http://localhost:3000/coletes`
3. Deves ver:
   - Carlos Silva com os coletes atualmente
   - Ordem correta dos convocados
   - Histórico com Rogério e Cesaro

---

## 🔍 Verificar Estado Atual (Opcional)

Para ver o estado atual da base de dados SEM fazer alterações:

```powershell
node ver_estado_coletes.js
```

Isto mostra:
- Quantos registos existem na convocatória
- Quantos registos existem no histórico de coletes
- Se está tudo vazio ou já configurado

---

## ⚠️ Problemas?

Se o script não funcionar:

1. Verifica se tens Node.js instalado:
   ```powershell
   node --version
   ```

2. Verifica se estás na pasta correta:
   ```powershell
   pwd
   ```
   Deve mostrar: `c:\Users\carlo\Documents\futsal-manager`

3. Tenta novamente executar:
   ```powershell
   node aplicar_coletes_agora.js
   ```

---

## 📝 Ficheiros Relevantes

- `aplicar_coletes_agora.js` - Script principal (usa better-sqlite3)
- `reconfigurar_coletes.js` - Alternativa (usa callback-based db)
- `ver_estado_coletes.js` - Para verificar estado
- `APLICAR_COLETES.bat` - Atalho Windows (não funciona em alguns sistemas)

---

## 💡 Dica

Se quiseres ver o output do script completo, executa:

```powershell
node aplicar_coletes_agora.js 2>&1 | Tee-Object -FilePath resultado.txt
cat resultado.txt
```

Isto grava e mostra o output simultaneamente.
