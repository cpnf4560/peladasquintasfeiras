@echo off
cls
echo ════════════════════════════════════════════════════════════════
echo  🔄 REINICIAR SERVIDOR - Sistema de Indisponíveis
echo ════════════════════════════════════════════════════════════════
echo.
echo ⚠️  IMPORTANTE: Pare o servidor atual primeiro!
echo     Pressione Ctrl+C na janela do servidor
echo.
echo ════════════════════════════════════════════════════════════════
echo  ⏱️  Aguarde 3 segundos...
echo ════════════════════════════════════════════════════════════════
timeout /t 3 /nobreak >nul
echo.
echo 🚀 Iniciando servidor com sistema de indisponíveis...
echo.
node server.js
