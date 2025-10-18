Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FUTSAL MANAGER - REINICIAR SERVIDOR" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] A parar processos Node..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2
Write-Host "      OK!" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] A iniciar servidor..." -ForegroundColor Yellow
Write-Host "      URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "      Estatísticas: http://localhost:3000/estatisticas" -ForegroundColor Cyan
Write-Host "      Convocatória: http://localhost:3000/convocatoria" -ForegroundColor Cyan
Write-Host "      Jogadores: http://localhost:3000/jogadores" -ForegroundColor Cyan
Write-Host ""
Write-Host "      Pressiona CTRL+C para parar" -ForegroundColor Red
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Mudar para a pasta e executar
Set-Location -Path "c:\Users\carlo\Documents\futsal-manager"

# NÃO FECHA - Mantém o PowerShell aberto enquanto o servidor corre
try {
    node server.js
} catch {
    Write-Host ""
    Write-Host "Erro ao iniciar servidor: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressiona ENTER para fechar"
}
