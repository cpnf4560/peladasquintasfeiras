@echo off
chcp 65001 > nul
echo ====================================
echo 🧹 LIMPAR EQUIPAS GERADAS
echo ====================================
echo.
echo Este script irá:
echo 1. Reiniciar o servidor
echo 2. Limpar as equipas geradas em memória
echo.
echo Pressione CTRL+C para cancelar
pause
echo.
echo 🔄 Reiniciando servidor...
taskkill /F /IM node.exe 2>nul
timeout /t 2 > nul
echo ✅ Servidor limpo!
echo.
echo Agora execute: npm start
echo.
pause
