@echo off
echo Executando configuracao de coletes...
node aplicar_coletes_agora.js > coletes_output.txt 2>&1
echo.
echo Output gravado em coletes_output.txt
echo.
type coletes_output.txt
pause
