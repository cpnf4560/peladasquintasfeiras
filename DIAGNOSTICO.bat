@echo off
echo ========================================
echo DIAGNOSTICO E CORRECAO DA CONVOCATORIA
echo ========================================
echo.

cd /d "%~dp0"

echo Executando diagnostico...
node diagnostico_convocatoria.js > diagnostico_output.txt 2>&1

echo.
echo Resultado salvo em: diagnostico_output.txt
echo.

type diagnostico_output.txt

echo.
echo ========================================
pause
