@echo off
echo ========================================
echo  COMMIT E PUSH - CORRECOES POSTGRESQL
echo ========================================
echo.

echo 1. Adicionando arquivos ao Git...
git add routes/convocatoria.js
echo    ✓ routes/convocatoria.js adicionado
echo.

echo 2. Criando commit...
git commit -m "Fix: Corrigir todas as queries PostgreSQL com placeholders

- Corrigidas 14 queries que usavam aspas duplas
- Todas as queries agora usam placeholders (?) com arrays
- Botoes de movimentacao funcionam corretamente
- Sistema de indisponiveis temporarios operacional
- Layout otimizado sem scroll horizontal
- Compativel com PostgreSQL (Render) e SQLite (local)

Queries corrigidas:
- Inicializacao de jogadores (linhas 28, 34)
- Mover para reservas/convocados (linhas 273, 282, 287, 293)
- Promover reserva (linha 314)
- Reorganizar equipas (linhas 730, 744)
- Setas de reordenacao (linhas 769, 783)
- Migracao para 10 convocados (linhas 793, 801, 807)"

if %ERRORLEVEL% EQU 0 (
    echo    ✓ Commit criado com sucesso
) else (
    echo    ✗ Erro ao criar commit
    pause
    exit /b 1
)
echo.

echo 3. Fazendo push para o repositorio...
git push

if %ERRORLEVEL% EQU 0 (
    echo    ✓ Push concluido com sucesso
    echo.
    echo ========================================
    echo  SUCESSO! Alteracoes enviadas para Git
    echo ========================================
    echo.
    echo Proximo passo: Deploy no Render
    echo.
) else (
    echo    ✗ Erro ao fazer push
    echo.
)

pause
