@echo off
title FUTSAL MANAGER - Servidor
color 0A
echo ============================================
echo   FUTSAL MANAGER - INICIAR SERVIDOR
echo ============================================
echo.
echo [1/2] A parar processos Node existentes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo       OK!
echo.
echo [2/2] A iniciar servidor...
echo       URL: http://localhost:3000
echo       Estatisticas: http://localhost:3000/estatisticas
echo.
echo       Pressiona CTRL+C para parar
echo ============================================
echo.
node server.js
echo.
echo Servidor parado.
pause
