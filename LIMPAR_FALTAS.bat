@echo off
cls
echo ========================================
echo LIMPAR CONTAGEM DE FALTAS
echo ========================================
echo.
echo Este script vai APAGAR todas as faltas
echo do historico.
echo.
echo Tem certeza que deseja continuar?
echo.
pause

cls
echo ========================================
echo LIMPANDO FALTAS...
echo ========================================
echo.

cd /d "%~dp0"
node limpar_faltas.js

echo.
echo ========================================
echo.
pause
