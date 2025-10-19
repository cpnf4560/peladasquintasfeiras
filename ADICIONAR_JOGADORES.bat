@echo off
echo ========================================
echo ADICIONAR JOGADORES FALTANTES
echo ========================================
echo.

cd /d "%~dp0"
node add_missing_players.js

echo.
echo ========================================
pause
