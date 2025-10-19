@echo off
echo ========================================
echo VERIFICACAO COMPLETA DO SISTEMA
echo ========================================
echo.

cd /d "%~dp0"
node verificar_sistema_completo.js

echo.
echo ========================================
pause
