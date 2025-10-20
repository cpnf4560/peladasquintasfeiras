Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " 🔄 RESTART COMPLETO - Sistema de Indisponíveis" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Parar todos os processos Node.js
Write-Host "1️⃣ Parando todos os processos Node.js..." -ForegroundColor White
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   Encontrados $($nodeProcesses.Count) processo(s) Node.js" -ForegroundColor Gray
    $nodeProcesses | ForEach-Object {
        Write-Host "   ⏹️  Parando processo ID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Todos os processos Node.js foram parados" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Nenhum processo Node.js em execução" -ForegroundColor Gray
}

Write-Host ""

# Verificar se tabela existe
Write-Host "2️⃣ Verificando tabela indisponiveis_temporarios..." -ForegroundColor White
$tableCheck = node -e "const {db} = require('./db'); db.query('SELECT COUNT(*) as total FROM indisponiveis_temporarios', [], (e,r) => { if(e) { console.log('ERRO'); process.exit(1); } else { console.log('OK'); process.exit(0); } }); setTimeout(() => process.exit(1), 2000);" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Tabela existe e está funcional" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Tabela não existe! Criando..." -ForegroundColor Yellow
    node criar_tabela_indisponiveis.js
}

Write-Host ""

# Aguardar um pouco
Write-Host "3️⃣ Aguardando estabilização..." -ForegroundColor White
Start-Sleep -Seconds 1
Write-Host "   ✅ Sistema pronto" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " 🚀 INICIANDO SERVIDOR LIMPO" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Aguarde o servidor iniciar..." -ForegroundColor White
Write-Host "🌐 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔑 Login: admin / rzq7xgq8" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Para parar o servidor: Pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
node server.js
