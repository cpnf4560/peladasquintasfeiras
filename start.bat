@echo off
echo ============================================
echo  FUTSAL MANAGER - INICIAR SERVIDOR
echo ============================================
echo.
echo [1/3] A parar processos Node existentes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo [2/3] A iniciar servidor na porta 3000...
echo        Acede: http://localhost:3000
echo        Teste CSS: http://localhost:3000/test_css.html
echo        Estatisticas: http://localhost:3000/estatisticas
echo.
node server.js
echo.
echo [3/3] Servidor parado.
pause
