@echo off
cls
echo ════════════════════════════════════════════════════════════════
echo  🔄 RESTART COMPLETO - Sistema de Indisponiveis
echo ════════════════════════════════════════════════════════════════
echo.

echo 1️⃣ Parando todos os processos Node.js...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Processos Node.js parados
) else (
    echo    ℹ️  Nenhum processo Node.js em execucao
)
echo.

echo 2️⃣ Aguardando estabilizacao...
timeout /t 2 /nobreak >nul
echo    ✅ Sistema pronto
echo.

echo ════════════════════════════════════════════════════════════════
echo  🚀 INICIANDO SERVIDOR LIMPO
echo ════════════════════════════════════════════════════════════════
echo.
echo 📝 Aguarde o servidor iniciar...
echo 🌐 URL: http://localhost:3000
echo 🔑 Login: admin / rzq7xgq8
echo.
echo ⚠️  Para parar o servidor: Pressione Ctrl+C
echo.

node server.js
