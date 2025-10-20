@echo off
echo ========================================
echo ATUALIZAR PASSWORD NO RENDER (POSTGRESQL)
echo ========================================
echo.
echo Este script vai atualizar a password do utilizador "presidente" para "bodelos"
echo no PostgreSQL do Render.
echo.
echo IMPORTANTE: Precisas da DATABASE_URL do Render!
echo.
echo Como obter a DATABASE_URL:
echo 1. Acede ao Render Dashboard
echo 2. Vai ao PostgreSQL Database
echo 3. Copia a "Internal Database URL"
echo.
pause
echo.
set /p DATABASE_URL="Cola aqui a DATABASE_URL do Render: "
echo.
echo Atualizando...
echo.
node atualizar_pass_render.js
echo.
pause
