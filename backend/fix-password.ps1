# fix-password.ps1 - Run this as Administrator
# Right-click and select "Run with PowerShell" as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Password Reset" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

try {
    Write-Host "Step 1: Stopping PostgreSQL..." -ForegroundColor Yellow
    Stop-Service -Name "postgresql-x64-18" -Force
    Start-Sleep -Seconds 2
    
    Write-Host "Step 2: Backing up pg_hba.conf..." -ForegroundColor Yellow
    $pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
    $backupPath = "$pgHbaPath.backup"
    Copy-Item $pgHbaPath $backupPath -Force
    
    Write-Host "Step 3: Modifying authentication to trust..." -ForegroundColor Yellow
    $config = Get-Content $pgHbaPath
    $config = $config -replace '127\.0\.0\.1/32.*scram-sha-256', 'host    all             all             127.0.0.1/32            trust'
    Set-Content $pgHbaPath $config
    
    Write-Host "Step 4: Starting PostgreSQL..." -ForegroundColor Yellow
    Start-Service -Name "postgresql-x64-18"
    Start-Sleep -Seconds 3
    
    Write-Host "Step 5: Resetting password..." -ForegroundColor Yellow
    $pgBin = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    & $pgBin -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD '1234';"
    
    Write-Host "Step 6: Restoring original authentication..." -ForegroundColor Yellow
    $config = Get-Content $backupPath
    $config = $config -replace '127\.0\.0\.1/32.*trust', 'host    all             all             127.0.0.1/32            scram-sha-256'
    Set-Content $pgHbaPath $config
    
    Write-Host "Step 7: Restarting PostgreSQL..." -ForegroundColor Yellow
    Stop-Service -Name "postgresql-x64-18" -Force
    Start-Sleep -Seconds 2
    Start-Service -Name "postgresql-x64-18"
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Password is now: 1234" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Testing connection..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    node check-db.js
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "1. You're running as Administrator" -ForegroundColor White
    Write-Host "2. PostgreSQL is installed at default location" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use pgAdmin to reset password manually" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

